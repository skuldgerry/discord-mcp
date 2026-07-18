#!/usr/bin/env node
import { access, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const builtList = resolve(root, "build/toolList.js");
await access(builtList).catch(() => {
  throw new Error("build/toolList.js is missing. Run npm run build first.");
});
const { toolList } = await import(`${pathToFileURL(builtList).href}?v=${Date.now()}`);
const out = resolve(root, "skills/discord-mcp/references/tool-catalog.md");

const rows = toolList.map((tool) => {
  const schema = tool.inputSchema ?? {};
  const required = new Set(schema.required ?? []);
  const args = Object.keys(schema.properties ?? {}).map((key) => required.has(key) ? `\`${key}\`*` : `\`${key}\``).join(", ") || "None";
  return `| \`${tool.name}\` | ${String(tool.description ?? "").replaceAll("|", "\\|")} | ${args} |`;
});

const markdown = `# Tool catalog\n\nGenerated from \`build/toolList.js\` by \`scripts/generate-tool-catalog.mjs\`. Required arguments are marked with *. Regenerate after changing \`src/toolList.ts\` and building.\n\n| Tool | Purpose | Arguments |\n|---|---|---|\n${rows.join("\n")}\n`;
await writeFile(out, markdown, "utf8");
console.log(`Wrote ${toolList.length} tools to ${out}`);
