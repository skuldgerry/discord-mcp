# Architecture and troubleshooting

## Runtime topology

- `src/index.ts`: loads `.env`, parses CLI flags, creates the Discord client, logs in, and selects a transport.
- `src/server.ts`: creates MCP SDK server instances, returns `toolList`, and resolves calls through the canonical handler registry.
- `src/transport.ts`: implements stdio and stateless Streamable HTTP. Both transports receive the same server factory; HTTP delegates JSON-RPC parsing and protocol negotiation to the official SDK transport.
- `src/toolList.ts`: canonical public tool names, descriptions, and JSON input schemas.
- `src/schemas.ts`: Zod validation used by handlers.
- `src/tools/*.ts`: Discord operation handlers.
- `src/tools/tools.ts`: canonical `toolHandlers` registry, handler export barrel, and shared context creation.

## Configuration precedence

- Token: `--config` JSON or token string, then `DISCORD_TOKEN` environment variable.
- Transport: `--transport`, default `stdio`.
- HTTP port: `--port`, default `8080`.
- HTTP binds to `0.0.0.0`.

Supply secrets only at runtime. Do not put a bot token, webhook token, or populated `.env` in source control, images, logs, skill files, or prompts.

HTTP is intentionally unauthenticated in the current internal deployment phase and does not validate Origin/Host. Keep it on a trusted network or behind an authenticated internal proxy; do not expose port 8080 directly to an untrusted network.

## Supported API baseline

- Node.js 22 or newer.
- Discord API v10 through `discord.js` 14.27.
- MCP SDK 1.29 with protocol negotiation handled by the SDK, including the stable 2025-11-25 revision.
- `structuredContent` is returned by the new message tools and selected existing read/role tools while text content remains available for older MCP clients.

## Discord intents

The client requests Guilds, GuildMessages, MessageContent, GuildMembers, GuildBans, GuildVoiceStates, GuildPresences, GuildInvites, and GuildModeration. Message Content, Server Members, and Presence are privileged intents and may need enabling in the application settings. A login error about privileged intents is a portal/configuration failure, not a tool-dispatch failure.

## Registration invariant

For a public tool name `discord_x`, verify all of these:

1. A definition exists in `src/toolList.ts`.
2. A handler is implemented, exported, and registered once in `toolHandlers` in `src/tools/tools.ts`.
3. `src/server.ts` resolves calls through `getToolHandler`.
4. `src/transport.ts` remains free of tool-specific dispatch and uses the shared server factory.
5. `npm run build` refreshed `build/` before the running service/container was restarted.

The historical `discord_list_servers` bug violated steps 3/4 parity: it was advertised but omitted from an HTTP dispatch table, so HTTP returned `Unknown tool` while standard MCP behavior appeared correct.

## Symptom guide

| Symptom | Most likely surface | First checks |
|---|---|---|
| Tool is missing from discovery | `toolList.ts` or stale build | Inspect `tools/list`, rebuild, restart |
| Tool is listed but unknown | Dispatch parity | Run `audit-dispatch.mjs` |
| Stdio works, HTTP fails | `transport.ts` | Verify SDK `handleRequest` delegation and the shared server factory |
| Login fails before calls | Token/intents | Check runtime secret and privileged intents |
| Missing access/unknown resource | Bot permissions or wrong ID | Discover target again and inspect bot role/channel access |
| Source fix has no runtime effect | Stale build/image/process | Rebuild, identify deployed commit/image digest, restart |

## HTTP debugging

Treat the public tool list and canonical registry as a consistency set. Search with:

```powershell
rg -n 'tools/list|tools/call|getToolHandler|discord_.*Handler' src/server.ts src/tools/tools.ts src/toolList.ts
```

Do not fix an unknown-tool failure by hiding the definition unless the tool is intentionally being removed. Complete or remove the implementation consistently across all surfaces.
