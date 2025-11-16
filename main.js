import { Command } from "commander";
import http from "http";
import fs from "fs";
import express from "express";
import multer from "multer";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

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

app.use(express.static(path.join(process.cwd(), "public")));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory Service API",
      version: "1.0.0",
      description: "Проста система інвентаризації для обліку речей.",
    },
    servers: [
      {
        url: `http://${options.host}:${options.port}`,
      },
    ],
  },
  apis: ["./main.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new inventory item
 *     description: Uploads photo and saves inventory item with name and description.
 *     tags:
 *       - Inventory
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               inventory_name:
 *                 type: string
 *                 description: Name of the item
 *               description:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Inventory name is required
 */
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

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags:
 *       - Inventory
 *     responses:
 *       200:
 *         description: List of all items
 */
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

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */
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

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update item's name or description
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 */
app.put("/inventory/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = inventory.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: "Not found" });

  if (req.body.name) item.name = req.body.name;
  if (req.body.description) item.description = req.body.description;
  saveInventory();
  res.json({ message: "Item updated", item });
});

/**
 * @swagger
 * /inventory/{id}/photo:
 *   get:
 *     summary: Get item photo
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo returned
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Photo not found
 */
app.get("/inventory/:id/photo", (req, res) => {
  const id = Number(req.params.id);
  const item = inventory.find((i) => i.id === id);
  if (!item || !item.photo) return res.status(404).json({ error: "No photo" });
  res.set("Content-Type", "image/jpeg");
  res.sendFile(path.resolve(options.cache, item.photo));
});

/**
 * @swagger
 * /inventory/{id}/photo:
 *   put:
 *     summary: Update item photo
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo updated
 *       404:
 *         description: Item not found
 */
app.put("/inventory/:id/photo", upload.single("photo"), (req, res) => {
  const id = Number(req.params.id);
  const item = inventory.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: "Not found" });
  if (!req.file) {
    return res.status(400).json({ error: "Photo file is required" });
  }

  item.photo = req.file.filename;
  saveInventory();
  res.json({ message: "Photo updated", item });
});

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
app.delete("/inventory/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = inventory.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  inventory.splice(index, 1);
  saveInventory();
  res.json({ message: "Item deleted" });
});

/**
 * @swagger
 * /RegisterForm.html:
 *   get:
 *     summary: Registration HTML form
 *     tags:
 *       - Forms
 *     responses:
 *       200:
 *         description: Registration form HTML
 */
app.get("/RegisterForm.html", (req, res) => {
  const formPath = path.join(process.cwd(), "RegisterForm.html");
  if (fs.existsSync(formPath)) {
    res.sendFile(formPath);
  } else {
    res.status(404).send("RegisterForm.html not found");
  }
});

/**
 * @swagger
 * /SearchForm.html:
 *   get:
 *     summary: Search HTML form
 *     tags:
 *       - Forms
 *     responses:
 *       200:
 *         description: Search form HTML
 */
app.get("/SearchForm.html", (req, res) => {
  const formPath = path.join(process.cwd(), "SearchForm.html");
  if (fs.existsSync(formPath)) {
    res.sendFile(formPath);
  } else {
    res.status(404).send("SearchForm.html not found");
  }
});

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search item by ID
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: includePhoto
 *         schema:
 *           type: string
 *         description: "Add photo_url if present"
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */
app.get("/search", (req, res) => {
  const { id, includePhoto } = req.query;
  const itemId = Number(id);

  if (isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  const item = inventory.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: "Not Found" });
  }

  const responseItem = {
    id: item.id,
    name: item.name,
    description: item.description,
  };

  if (includePhoto && item.photo) {
    responseItem.photo_url = `/inventory/${item.id}/photo`;
  }

  res.json(responseItem);
});

app.use((req, res) => {
  res.status(405).send("Method Not Allowed");
});

const server = http.createServer(app);
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
  console.log(`Cache-directory: ${fs.realpathSync(options.cache)}`);
});
