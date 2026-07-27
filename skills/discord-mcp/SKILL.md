---
name: discord-mcp
description: Operate, troubleshoot, extend, and validate the MCP-Discord server and its discord_* tools. Use when an agent needs to perform Discord workflows through this MCP, choose or sequence Discord tools, diagnose unknown-tool or transport problems, add or change a tool, verify tool registration and dispatch parity, configure stdio or HTTP transport, build the TypeScript project, or review changes to this repository.
---

# Discord MCP

## Establish the task mode

Choose one mode before acting:

- **Operate Discord:** call exposed `discord_*` tools to read or change Discord state.
- **Maintain the server:** inspect or modify the MCP implementation in this repository.
- **Diagnose integration:** trace client configuration, authentication, transport, tool discovery, and dispatch.

If MCP tools are namespaced by the host, identify the available tool whose final segment matches the documented `discord_*` name. Never assume a Discord connector is available merely because this skill is loaded.

## Operate Discord safely

1. Discover context with read-only tools before mutations. Prefer `discord_list_servers`, then server, channel, role, member, invite, or audit lookups as relevant.
2. Reuse IDs returned by tools. Do not guess guild, channel, message, role, webhook, or user IDs.
3. Validate the target and scope immediately before any destructive or externally visible action.
4. Ask for confirmation when the request leaves the target ambiguous or when it would mass-delete, ban/kick, remove a channel/role/webhook/forum post, or affect many members.
5. Perform the smallest call sequence that satisfies the request. Do not retry a mutation blindly after a timeout; read state first to determine whether it succeeded.
6. Report what changed, where, and any partial failures. Never expose bot or webhook tokens.

Read [references/tool-catalog.md](references/tool-catalog.md) when selecting tools or arguments. Read [references/safety-and-workflows.md](references/safety-and-workflows.md) for multi-step moderation, messaging, role, channel, forum, invite, webhook, and voice workflows.

## Diagnose an integration

Trace failures in this order:

1. Confirm the server process starts and uses the expected transport.
2. Confirm `DISCORD_TOKEN` is supplied at runtime and required privileged intents are enabled in the Discord Developer Portal.
3. Request `tools/list` and record the exact exposed name.
4. Call a read-only tool with known-good IDs.
5. If the tool is listed but returns `Unknown tool`, audit every dispatch surface.
6. If the tool is absent, inspect `src/toolList.ts` and rebuild/restart the exact artifact used by the client.
7. If stdio works but HTTP fails, verify that HTTP still delegates to the SDK transport and creates the same server factory used by stdio.

Run:

```powershell
node skills/discord-mcp/scripts/audit-dispatch.mjs .
```

Read [references/architecture.md](references/architecture.md) for transport topology, configuration precedence, and the complete registration checklist.

## Maintain or extend the server

For every new or renamed tool:

1. Define or reuse argument validation in `src/schemas.ts`.
2. Implement the handler under `src/tools/` and export it through `src/tools/tools.ts`.
3. Add the public definition and JSON input schema to `src/toolList.ts`.
4. Register the handler once in the `toolHandlers` registry in `src/tools/tools.ts`.
5. Do not add transport-specific tool dispatch. Both stdio and HTTP must use the same server factory and registry.
6. Keep returned values in MCP `ToolResponse` shape and route Discord API failures through `handleDiscordError`.
7. Run the dispatch audit, TypeScript build, and relevant smoke checks.

Do not edit generated `build/` files by hand. Change `src/`, then run `npm run build`.

## Validate changes

Run the checks proportionate to the change:

```powershell
node skills/discord-mcp/scripts/audit-dispatch.mjs .
npm run build
```

Regenerate the catalog after changing `src/toolList.ts` and successfully building:

```powershell
node skills/discord-mcp/scripts/generate-tool-catalog.mjs .
```

The project currently has no implemented automated test suite; `npm test` intentionally exits with an error. State that limitation rather than presenting the build as full behavioral coverage.

## Coordinate multiple agents

Partition work by non-overlapping surfaces, such as handler implementation, transport parity, documentation/catalog, and verification. Give every agent the repository root and this skill path. Require the integrating agent to rerun the dispatch audit and build after merging shared-file changes because `src/server.ts`, `src/transport.ts`, and `src/toolList.ts` are common collision points.
