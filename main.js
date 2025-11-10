import { Command } from "commander";
import http from "http";
import fs from "fs";
import express from "express";

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

const server = http.createServer(app);
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
  console.log(`Cache-directory: ${fs.realpathSync(options.cache)}`);
});
