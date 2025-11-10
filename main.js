import { Command } from "commander";
import http from "http";
import fs from "fs";
import express from "express";
import multer from "multer";

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

let inventory = [];
let nextId = 1;

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
  res.status(201).json({ message: "Item created", item });
});

const server = http.createServer(app);
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
  console.log(`Cache-directory: ${fs.realpathSync(options.cache)}`);
});
