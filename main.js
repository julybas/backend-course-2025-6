import { Command } from "commander";
import http from "http";
import fs from "fs";
import express from "express";
import multer from "multer";
import path from "path";
import swaggerUi from "swagger-ui-express";

const program = new Command();
program
  .requiredOption("-h, --host <host>", "server host")
  .requiredOption("-p, --port <port>", "server port")
  .requiredOption("-c, --cache <path>", "path to directory")
  .parse(process.argv);
const options = program.opts();

if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

import { swaggerSpec } from "./swagger/swagger.js";
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, options.cache),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const INVENTORY_FILE = path.join(options.cache, "inventory.json");
let inventory = [];
let nextId = 1;

if (fs.existsSync(INVENTORY_FILE)) {
  try {
    const data = fs.readFileSync(INVENTORY_FILE, "utf8");
    inventory = JSON.parse(data);
    nextId = Math.max(...inventory.map((i) => i.id), 0) + 1;
    console.log(`Loaded ${inventory.length} items from inventory file`);
  } catch (error) {
    console.error("Error loading inventory file:", error.message);
  }
}

function saveInventory() {
  try {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inventory, null, 2));
  } catch (error) {
    console.error("Error saving inventory:", error.message);
  }
}

app.post("/register", upload.single("photo"), (req, res) => {
  const { inventory_name, description } = req.body;
  if (!inventory_name) {
    return res.status(400).json({ error: "Inventory name is required" });
  }
  const item = {
    id: nextId++,
    name: inventory_name,
    description: description || "",
    photo: req.file ? req.file.filename : null,
  };
  inventory.push(item);
  saveInventory();
  res.status(201).json({ message: "Item created", item });
});

app.get("/inventory", (req, res) => {
  res.json(
    inventory.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      photo_url: i.photo ? `/inventory/${i.id}/photo` : null,
    }))
  );
});

app.get("/inventory/:id", (req, res) => {
  const item = inventory.find((i) => i.id == req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({
    id: item.id,
    name: item.name,
    description: item.description,
    photo_url: item.photo ? `/inventory/${item.id}/photo` : null,
  });
});

app.put("/inventory/:id", (req, res) => {
  const item = inventory.find((i) => i.id == req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  if (req.body.name) item.name = req.body.name;
  if (req.body.description) item.description = req.body.description;
  saveInventory();
  res.json({ message: "Item updated", item });
});

app.get("/inventory/:id/photo", (req, res) => {
  const item = inventory.find((i) => i.id == req.params.id);
  if (!item || !item.photo) return res.status(404).json({ error: "No photo" });
  res.set("Content-Type", "image/jpeg");
  res.sendFile(path.resolve(options.cache, item.photo));
});

app.put("/inventory/:id/photo", upload.single("photo"), (req, res) => {
  const item = inventory.find((i) => i.id == req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  if (!req.file)
    return res.status(400).json({ error: "Photo file is required" });
  item.photo = req.file.filename;
  saveInventory();
  res.json({ message: "Photo updated", item });
});

app.delete("/inventory/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = inventory.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  inventory.splice(index, 1);
  saveInventory();
  res.json({ message: "Item deleted" });
});

app.get("/search", (req, res) => {
  const id = Number(req.query.id);
  const item = inventory.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: "Not Found" });
  res.json({
    id: item.id,
    name: item.name,
    description: item.description,
    photo_url:
      req.query.includePhoto && item.photo && `/inventory/${item.id}/photo`,
  });
});

app.use((req, res) => res.status(405).send("Method Not Allowed"));

http.createServer(app).listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});
