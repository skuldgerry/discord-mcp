import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { DiscordMCPServer } from "../build/server.js";
import { StreamableHttpTransport } from "../build/transport.js";
import {
  AllowedMentionsSchema, CreateVoiceChannelSchema, EditChannelSchema,
  MessageComponentSchema, PermissionOverwriteSchema, ReadMessagesSchema,
} from "../build/schemas.js";

const id = "123456789012345678";
const accept = "application/json, text/event-stream";
const expectedVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

async function startHttp(t) {
  let discordReads = 0;
  const fakeGuild = { id, name: "Local fixture", iconURL: () => null };
  const discord = {
    isReady: () => true,
    guilds: { fetch: async () => {
      discordReads++;
      return { size: 1, map: fn => [fn(fakeGuild)] };
    } },
  };
  const transport = new StreamableHttpTransport(0);
  const server = new DiscordMCPServer(discord, transport);
  await server.start();
  t.after(() => server.stop());
  const url = new URL("http://127.0.0.1:" + transport.httpServer.address().port + "/mcp");
  return { transport, url, getDiscordReads: () => discordReads };
}

async function connect(t, url) {
  const client = new Client({ name: "compatibility-test", version: "1.0.0" });
  t.after(() => client.close());
  await client.connect(new StreamableHTTPClientTransport(url), { timeout: 5000 });
  return client;
}

test("schema boundaries retain defaults, nullability, integer limits and strict permissions", () => {
  assert.equal(ReadMessagesSchema.parse({ channelId: id }).limit, 50);
  assert.equal(CreateVoiceChannelSchema.parse({
    guildId: id, channelName: "voice", parentId: null, userLimit: 99,
  }).parentId, null);
  for (const userLimit of [-1, 100, 1.5, NaN, Infinity, "1"]) {
    assert.equal(CreateVoiceChannelSchema.safeParse({
      guildId: id, channelName: "voice", userLimit,
    }).success, false);
  }
  assert.equal(AllowedMentionsSchema.safeParse({ parse: [], unexpected: true }).success, false);
  assert.equal(PermissionOverwriteSchema.safeParse({
    id, type: "role", allow: ["ViewChannel"], deny: ["ViewChannel"],
  }).success, false);
  assert.equal(EditChannelSchema.safeParse({
    channelId: id, parentId: id, categoryId: "223456789012345678",
  }).success, false);
  assert.equal(EditChannelSchema.safeParse({ channelId: id, lockPermissions: true }).success, false);
  assert.equal(EditChannelSchema.safeParse({ channelId: id }).success, false);
  assert.equal(MessageComponentSchema.safeParse({
    type: "container", components: [{
      type: "link_buttons", buttons: [{ label: "Bad", url: "javascript:alert(1)" }],
    }],
  }).success, false);
  assert.equal(MessageComponentSchema.safeParse({
    type: "container", components: [{
      type: "link_buttons", buttons: [{ label: "Help", url: "https://example.com/help" }],
    }],
  }).success, true);
});

test("HTTP MCP preserves catalog, mocked reads and actionable nested Zod errors", async t => {
  const fixture = await startHttp(t);
  const client = await connect(t, fixture.url);
  assert.equal(client.getServerVersion().version, expectedVersion);
  assert.equal((await client.listTools()).tools.length, 75);
  assert.equal((await client.listTools()).tools.length, 75);
  const read = await client.callTool({ name: "discord_list_servers", arguments: {} });
  assert(!read.isError);
  assert.equal(JSON.parse(read.content[0].text)[0].id, id);
  assert.equal(fixture.getDiscordReads(), 1);
  const invalid = await client.callTool({
    name: "discord_create_voice_channel",
    arguments: { guildId: id, channelName: "voice", userLimit: 100 },
  });
  assert.equal(invalid.isError, true);
  assert.match(invalid.content[0].text, /Invalid arguments: userLimit:/);
  const nested = await client.callTool({
    name: "discord_create_text_channel",
    arguments: { guildId: id, channelName: "text", permissionOverwrites: [{
      id, type: "role", allow: ["ViewChannel"], deny: ["ViewChannel"],
    }] },
  });
  assert.equal(nested.isError, true);
  assert.match(nested.content[0].text, /Invalid arguments: permissionOverwrites\.0\.deny:/);
  assert.equal(fixture.getDiscordReads(), 1, "invalid input must not reach the Discord client");
  const unknown = await client.callTool({ name: "__unknown_test_tool__", arguments: {} });
  assert.equal(unknown.isError, true);
  assert.match(unknown.content[0].text, /Unknown tool/);
});

test("HTTP rejects malformed, oversized and unsupported requests without breaking later MCP calls", async t => {
  const { url } = await startHttp(t);
  for (const method of ["GET", "DELETE"]) {
    assert.equal((await fetch(url, { method })).status, 405);
  }
  assert.equal((await fetch(new URL("/healthz", url))).status, 200);
  const request = (body, headers = {}) => fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: accept, ...headers }, body,
  });
  assert.equal((await request("{")).status, 400);
  assert.equal((await request(JSON.stringify({ notJsonRpc: true }))).status, 400);
  assert.equal((await request(JSON.stringify({ padding: "x".repeat(1024 * 1024) }))).status, 413);
  assert.equal((await request(JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "tools/list",
  }), { "Content-Type": "text/plain" })).status, 415);
  const client = await connect(t, url);
  assert.equal((await client.listTools()).tools.length, 75);
});

test("SDK HTTP redirects stay on origin by default", async t => {
  const { url, transport } = await startHttp(t);
  let crossedOrigin = 0;
  const other = createServer((_req, res) => { crossedOrigin++; res.writeHead(500).end(); });
  other.listen(0, "127.0.0.1");
  await once(other, "listening");
  t.after(() => new Promise(resolve => other.close(resolve)));
  const externalUrl = "http://127.0.0.1:" + other.address().port + "/mcp";
  transport.app.all("/same-origin", (_req, res) => res.redirect(307, "/mcp"));
  transport.app.all("/cross-origin", (_req, res) => res.redirect(307, externalUrl));
  const same = await connect(t, new URL("/same-origin", url));
  assert.equal((await same.listTools()).tools.length, 75);
  const cross = new Client({ name: "redirect-test", version: "1.0.0" });
  t.after(() => cross.close());
  await assert.rejects(cross.connect(new StreamableHTTPClientTransport(
    new URL("/cross-origin", url),
  ), { timeout: 5000 }));
  assert.equal(crossedOrigin, 0, "cross-origin redirect must be rejected before sending a request");
});

test("compiled stdio initializes and returns schema errors without a Discord token", async t => {
  const client = new Client({ name: "stdio-compatibility", version: "1.0.0" });
  t.after(() => client.close());
  const transport = new StdioClientTransport({
    command: process.execPath, args: ["build/index.js", "--transport", "stdio"],
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { DISCORD_TOKEN: "" }, stderr: "pipe",
  });
  transport.stderr.on("data", () => {});
  await client.connect(transport, { timeout: 5000 });
  assert.equal(client.getServerVersion().version, expectedVersion);
  assert.equal((await client.listTools()).tools.length, 75);
  const invalid = await client.callTool({
    name: "discord_create_voice_channel",
    arguments: { guildId: id, channelName: "voice", userLimit: 100 },
  });
  assert.equal(invalid.isError, true);
  assert.match(invalid.content[0].text, /Invalid arguments: userLimit:/);
  const loggedOut = await client.callTool({ name: "discord_list_servers", arguments: {} });
  assert.equal(loggedOut.isError, true);
  assert.match(loggedOut.content[0].text, /not logged in/i);
});
