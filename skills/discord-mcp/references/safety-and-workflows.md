# Safety and workflow patterns

## General guardrails

- Read before writing; verify IDs and human-readable names together.
- Treat sends, DMs, reactions, moderation, role changes, channel changes, invites, webhooks, and voice controls as externally visible actions.
- Avoid duplicate sends and repeated mutations after uncertain network results.
- Use a reason for moderation and administrative changes when the tool supports it.
- Never return or log tokens. A webhook token grants authority to post through that webhook.
- Check bot permissions and role hierarchy when Discord rejects an otherwise valid call.

## Discovery

Start with `discord_list_servers`. Use `discord_get_server_info` for channel structure and `discord_list_roles` or `discord_list_members` when the task depends on role/member identity. Preserve returned snowflake IDs as strings.

## Messaging and forums

Resolve the target channel/thread first. For reads, keep limits narrow. Before deleting a message or forum post, verify its ID and context. For webhook sends, obtain tokens from an approved secret source and do not echo them.

## Moderation

Inspect member/server context before kick, ban, timeout, softban, voice disconnect, or role removal. Confirm ambiguous targets. Prefer the least severe action that the user explicitly requested. After an action, perform a read-only verification when available.

Bulk deletion is especially risky: confirm the channel, count, and filters; explain that Discord API age restrictions may limit eligible messages; do not broaden filters automatically after a partial result.

## Channels, roles, invites, and webhooks

Creating is usually reversible but visible; deletion is destructive. Before deletion, resolve the object and state its name plus ID. Role operations can fail when the bot's highest role is below the target role. Invite creation should use the narrowest lifetime and use count consistent with the request.

## Voice

Confirm guild, member, and destination voice channel before moving a member. Mute/deafen booleans must reflect the requested final state; do not infer a toggle from wording unless current state is known.

## Multi-step execution pattern

1. Discover the guild and resource IDs.
2. Read relevant current state.
3. Summarize the planned target if ambiguity or high impact remains.
4. Execute one mutation at a time.
5. Verify current state before retrying or continuing dependent changes.
6. Report completed, skipped, and failed actions separately.
