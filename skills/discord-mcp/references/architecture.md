# Architecture and troubleshooting

## Runtime topology

- `src/index.ts`: loads `.env`, parses CLI flags, creates the Discord client, logs in, and selects a transport.
- `src/server.ts`: configures the MCP SDK server, returns `toolList`, and dispatches standard MCP calls.
- `src/transport.ts`: implements stdio and streamable HTTP. HTTP has hand-maintained request dispatch in addition to the standard server switch.
- `src/toolList.ts`: canonical public tool names, descriptions, and JSON input schemas.
- `src/schemas.ts`: Zod validation used by handlers.
- `src/tools/*.ts`: Discord operation handlers.
- `src/tools/tools.ts`: handler export barrel and shared context creation.

## Configuration precedence

- Token: `--config` JSON or token string, then `DISCORD_TOKEN` environment variable.
- Transport: `--transport`, default `stdio`.
- HTTP port: `--port`, default `8080`.
- HTTP binds to `0.0.0.0`.

Supply secrets only at runtime. Do not put a bot token, webhook token, or populated `.env` in source control, images, logs, skill files, or prompts.

## Discord intents

The client requests Guilds, GuildMessages, MessageContent, GuildMembers, GuildBans, GuildVoiceStates, GuildPresences, GuildInvites, and GuildModeration. Message Content, Server Members, and Presence are privileged intents and may need enabling in the application settings. A login error about privileged intents is a portal/configuration failure, not a tool-dispatch failure.

## Registration invariant

For a public tool name `discord_x`, verify all of these:

1. A definition exists in `src/toolList.ts`.
2. A handler is implemented and exported from `src/tools/tools.ts`.
3. `src/server.ts` dispatches `discord_x`.
4. Each relevant switch in `src/transport.ts` dispatches `discord_x`.
5. `npm run build` refreshed `build/` before the running service/container was restarted.

The historical `discord_list_servers` bug violated steps 3/4 parity: it was advertised but omitted from an HTTP dispatch table, so HTTP returned `Unknown tool` while standard MCP behavior appeared correct.

## Symptom guide

| Symptom | Most likely surface | First checks |
|---|---|---|
| Tool is missing from discovery | `toolList.ts` or stale build | Inspect `tools/list`, rebuild, restart |
| Tool is listed but unknown | Dispatch parity | Run `audit-dispatch.mjs` |
| Stdio works, HTTP fails | `transport.ts` | Compare all HTTP switches with `server.ts` |
| Login fails before calls | Token/intents | Check runtime secret and privileged intents |
| Missing access/unknown resource | Bot permissions or wrong ID | Discover target again and inspect bot role/channel access |
| Source fix has no runtime effect | Stale build/image/process | Rebuild, identify deployed commit/image digest, restart |

## HTTP debugging

Treat the public tool list and every route that accepts a method/tool name as a consistency set. Search with:

```powershell
rg -n 'tools/list|tools/call|Unknown tool|case .discord_' src/server.ts src/transport.ts src/toolList.ts
```

Do not fix an unknown-tool failure by hiding the definition unless the tool is intentionally being removed. Complete or remove the implementation consistently across all surfaces.
