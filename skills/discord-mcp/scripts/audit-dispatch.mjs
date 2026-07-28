#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const read = (file) => readFile(resolve(root, file), "utf8");
const namesFromList = (text) => [...text.matchAll(/name:\s*["'](discord_[a-z0-9_]+)["']/g)].map(match => match[1]);
const namesFromRegistry = (text) => [...text.matchAll(/^\s*(discord_[a-z0-9_]+):\s*[a-zA-Z][a-zA-Z0-9]*Handler,/gm)].map(match => match[1]);
const difference = (left, right) => [...left].filter((name) => !right.has(name)).sort();

const [toolListText, toolsText, serverText, transportText] = await Promise.all([
  read("src/toolList.ts"),
  read("src/tools/tools.ts"),
  read("src/server.ts"),
  read("src/transport.ts"),
]);

const advertisedNames = namesFromList(toolListText);
const registeredNames = namesFromRegistry(toolsText);
const advertised = new Set(advertisedNames);
const registered = new Set(registeredNames);
const duplicates = names => [...new Set(names.filter((name, index) => names.indexOf(name) !== index))].sort();

let failed = false;
console.log(`Advertised tools: ${advertised.size}`);
console.log(`Registered handlers: ${registered.size}`);
for (const [label, values] of [
  ["Advertised without a handler", difference(advertised, registered)],
  ["Registered but not advertised", difference(registered, advertised)],
  ["Duplicate advertised names", duplicates(advertisedNames)],
  ["Duplicate registry names", duplicates(registeredNames)],
]) {
  if (values.length) {
    failed = true;
    console.error(`${label}: ${values.join(", ")}`);
  }
}

const dispatcherChecks = [
  ["Standard MCP dispatcher uses the canonical registry", /getToolHandler\(name\)/.test(serverText)],
  [
    "Stdio dispatcher receives the shared MCP server factory",
    /async start\(serverFactory: MCPServerFactory\)[\s\S]*?this\.server = serverFactory\(\)[\s\S]*?this\.server\.connect\(this\.transport\)/.test(transportText),
  ],
  [
    "Streamable HTTP dispatcher receives the shared MCP server factory",
    /this\.serverFactory = serverFactory/.test(transportText) &&
      /const server = this\.serverFactory\(\)/.test(transportText),
  ],
  [
    "Streamable HTTP POST dispatcher delegates to the SDK transport",
    /this\.app\.post\(["']\/mcp["'][\s\S]*?transport\.handleRequest\(req,\s*res,\s*req\.body\)/.test(transportText),
  ],
  [
    "Every transport contains no independent discord_* dispatch table",
    !/case\s+["']discord_/.test(transportText) &&
      !/discord_[a-z0-9_]+\s*:/.test(transportText),
  ],
];

for (const check of dispatcherChecks) {
  console.log(`${check[1] ? "PASS" : "FAIL"}: ${check[0]}`);
  if (!check[1]) failed = true;
}

if (failed) process.exitCode = 1;
else console.log("Dispatch parity check passed.");
