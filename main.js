import { Command } from "commander";
import http from "http";
import fs from "fs";
import express from "express";
import multer from "multer";
import path from "path";

const program = new Command();

program
  .requiredOption("-H, --host <host>", "server host")
  .requiredOption("-p, --port <port>", "server port")
  .requiredOption("-c, --cache <path>", "path to directory");

program.parse(process.argv);
const options = program.opts();

if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const server = http.createServer(app);
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
  console.log(`Cache-directory: ${fs.realpathSync(options.cache)}`);
});
