#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const read = (file) => readFile(resolve(root, file), "utf8");
const namesFromList = (text) => new Set([...text.matchAll(/name:\s*["'](discord_[a-z0-9_]+)["']/g)].map((m) => m[1]));
const namesFromCases = (text) => new Set([...text.matchAll(/case\s+["'](discord_[a-z0-9_]+)["']\s*:/g)].map((m) => m[1]));
const difference = (left, right) => [...left].filter((name) => !right.has(name)).sort();

const [toolListText, serverText, transportText] = await Promise.all([
  read("src/toolList.ts"),
  read("src/server.ts"),
  read("src/transport.ts"),
]);

const advertised = namesFromList(toolListText);
const surfaces = {
  "standard MCP server": namesFromCases(serverText),
  "HTTP transport (combined switches)": namesFromCases(transportText),
};

let failed = false;
console.log(`Advertised tools: ${advertised.size}`);
for (const [label, dispatched] of Object.entries(surfaces)) {
  const missing = difference(advertised, dispatched);
  const extra = difference(dispatched, advertised);
  console.log(`${label}: ${dispatched.size} unique dispatched tools`);
  if (missing.length) {
    failed = true;
    console.error(`  Missing: ${missing.join(", ")}`);
  }
  if (extra.length) {
    failed = true;
    console.error(`  Not advertised: ${extra.join(", ")}`);
  }
}

if (failed) process.exitCode = 1;
else console.log("Dispatch parity check passed.");
