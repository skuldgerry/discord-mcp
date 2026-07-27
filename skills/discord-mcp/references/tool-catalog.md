# Tool catalog

Generated from `build/toolList.js` by `scripts/generate-tool-catalog.mjs`. Required arguments are marked with *. Regenerate after changing `src/toolList.ts` and building.

| Tool | Purpose | Arguments |
|---|---|---|
| `discord_create_category` | Creates a new category in a Discord server. | `guildId`*, `name`*, `position`, `reason` |
| `discord_list_emojis` | List server emojis | `guildId`* |
| `discord_create_emoji` | Create a custom emoji from an image URL | `guildId`*, `name`*, `imageUrl`*, `reason` |
| `discord_delete_emoji` | Delete a custom emoji | `guildId`*, `emojiId`*, `reason` |
| `discord_list_roles` | List all roles in a server | `guildId`* |
| `discord_set_slowmode` | Set channel slowmode in seconds | `channelId`*, `rateLimitPerUserSeconds`*, `reason` |
| `discord_lock_channel` | Deny @everyone from sending messages | `channelId`*, `reason` |
| `discord_unlock_channel` | Restore @everyone default send messages permission | `channelId`*, `reason` |
| `discord_pin_message` | Pin a message in a channel | `channelId`*, `messageId`* |
| `discord_unpin_message` | Unpin a message in a channel | `channelId`*, `messageId`* |
| `discord_softban_member` | Ban then immediately unban to purge messages | `guildId`*, `userId`*, `deleteMessageDays`, `reason` |
| `discord_dm_member` | Send a direct message to a user | `userId`*, `message`* |
| `discord_get_channel_invites` | List invites for a specific channel | `channelId`* |
| `discord_get_vanity_url` | Get server vanity URL if available | `guildId`* |
| `discord_disconnect_voice` | Disconnects a member from their current voice channel | `guildId`*, `userId`*, `reason` |
| `discord_move_voice` | Moves a member to a specific voice channel | `guildId`*, `userId`*, `channelId`*, `reason` |
| `discord_voice_mute` | Server mute or unmute a member in voice | `guildId`*, `userId`*, `mute`*, `reason` |
| `discord_voice_deafen` | Server deafen or undeafen a member in voice | `guildId`*, `userId`*, `deafen`*, `reason` |
| `discord_get_member_info` | Gets detailed member data | `guildId`*, `userId`* |
| `discord_list_members` | Lists members in a server, with optional limit and query | `guildId`*, `limit`, `query` |
| `discord_remove_timeout` | Removes an active timeout from a member | `guildId`*, `userId`*, `reason` |
| `discord_bulk_delete` | Bulk delete recent messages with optional filters | `channelId`*, `count`*, `filterUserId`, `filterContains`, `reason` |
| `discord_set_nickname` | Set or clear a member nickname | `guildId`*, `userId`*, `nickname`, `reason` |
| `discord_get_bans` | List banned users | `guildId`* |
| `discord_create_invite` | Create an invite link for a channel | `channelId`*, `maxAgeSeconds`, `maxUses`, `temporary`, `reason` |
| `discord_get_invites` | List server invites | `guildId`* |
| `discord_get_audit_logs` | Fetch server audit logs | `guildId`*, `limit`, `actionType`, `userId` |
| `discord_edit_category` | Edits an existing Discord category (name and position). | `categoryId`*, `name`, `position`, `reason` |
| `discord_delete_category` | Deletes a Discord category by ID. | `categoryId`*, `reason` |
| `discord_login` | Logs in to Discord using the configured token | `token` |
| `discord_send` | Sends a Discord message. Supports legacy text, typed Components V2, empty allowed_mentions, and suppressed notifications. | `channelId`*, `message`, `content`, `components`, `allowedMentions`, `suppressNotifications` |
| `discord_edit_message` | Edits a message authored by this bot, using text or the same typed Components V2 model as discord_send. | `channelId`*, `messageId`*, `message`, `content`, `components`, `allowedMentions` |
| `discord_get_message` | Gets one Discord message with flags, Components V2, attachments, embeds, poll data, and bot editability. | `channelId`*, `messageId`* |
| `discord_get_bot_permissions` | Gets the bot's effective guild or channel permissions and common Discord capabilities. | `guildId`*, `channelId` |
| `discord_forward_message` | Forwards an existing Discord message to another channel using the native message snapshot. | `sourceChannelId`*, `messageId`*, `targetChannelId`* |
| `discord_crosspost_message` | Publishes a message from an Announcement channel. | `channelId`*, `messageId`* |
| `discord_send_poll` | Sends a native Discord poll with typed answers, duration, mention controls, and optional silent delivery. | `channelId`*, `question`*, `answers`*, `durationHours`*, `allowMultiselect`, `allowedMentions`, `suppressNotifications` |
| `discord_end_poll` | Ends a native Discord poll authored by this bot. | `channelId`*, `messageId`* |
| `discord_get_poll_voters` | Lists users who voted for one answer in a native Discord poll. | `channelId`*, `messageId`*, `answerId`*, `limit`, `after` |
| `discord_get_forum_channels` | Lists all forum channels in a specified Discord server (guild) | `guildId`* |
| `discord_create_forum_post` | Creates a new post in a Discord forum channel with optional tags | `forumChannelId`*, `title`*, `content`*, `tags` |
| `discord_get_forum_post` | Retrieves details about a forum post including its messages | `threadId`* |
| `discord_reply_to_forum` | Adds a reply to an existing forum post or thread | `threadId`*, `message`* |
| `discord_create_text_channel` | Creates a new text channel in a Discord server with an optional topic | `guildId`*, `channelName`*, `topic` |
| `discord_delete_channel` | Deletes a Discord channel with an optional reason | `channelId`*, `reason` |
| `discord_read_messages` | Retrieves messages from a Discord text channel with a configurable limit | `channelId`*, `limit` |
| `discord_get_server_info` | Retrieves detailed information about a Discord server including channels and member count | `guildId`* |
| `discord_add_reaction` | Adds an emoji reaction to a specific Discord message | `channelId`*, `messageId`*, `emoji`* |
| `discord_add_multiple_reactions` | Adds multiple emoji reactions to a Discord message at once | `channelId`*, `messageId`*, `emojis`* |
| `discord_remove_reaction` | Removes a specific emoji reaction from a Discord message | `channelId`*, `messageId`*, `emoji`*, `userId` |
| `discord_delete_forum_post` | Deletes a forum post or thread with an optional reason | `threadId`*, `reason` |
| `discord_delete_message` | Deletes a specific message from a Discord text channel | `channelId`*, `messageId`*, `reason` |
| `discord_create_webhook` | Creates a new webhook for a Discord channel | `channelId`*, `name`*, `avatar`, `reason` |
| `discord_send_webhook_message` | Sends a message to a Discord channel using a webhook | `webhookId`*, `webhookToken`*, `content`*, `username`, `avatarURL`, `threadId` |
| `discord_edit_webhook` | Edits an existing webhook for a Discord channel | `webhookId`*, `webhookToken`, `name`, `avatar`, `channelId`, `reason` |
| `discord_delete_webhook` | Deletes an existing webhook for a Discord channel | `webhookId`*, `webhookToken`, `reason` |
| `discord_list_servers` | Lists all Discord servers the bot is a member of | None |
| `discord_kick_member` | Kicks a member from a guild | `guildId`*, `userId`*, `reason` |
| `discord_ban_member` | Bans a member from a guild | `guildId`*, `userId`*, `deleteMessageDays`, `reason` |
| `discord_unban_member` | Unbans a user in a guild | `guildId`*, `userId`*, `reason` |
| `discord_timeout_member` | Timeouts a member for a duration in minutes | `guildId`*, `userId`*, `durationMinutes`*, `reason` |
| `discord_disconnect_member` | Disconnects a member from their current voice channel | `guildId`*, `userId`*, `reason` |
| `discord_move_member` | Moves a member to a specific voice channel | `guildId`*, `userId`*, `channelId`*, `reason` |
| `discord_add_role` | Adds a role to a member | `guildId`*, `userId`*, `roleId`*, `reason` |
| `discord_remove_role` | Removes a role from a member | `guildId`*, `userId`*, `roleId`*, `reason` |
| `discord_create_role` | Creates a role in a guild | `guildId`*, `name`*, `color`, `colors`, `hoist`, `mentionable`, `permissions`, `reason` |
| `discord_edit_role` | Edits a role in a guild | `guildId`*, `roleId`*, `name`, `color`, `colors`, `hoist`, `mentionable`, `permissions`, `reason` |
| `discord_delete_role` | Deletes a role in a guild | `guildId`*, `roleId`*, `reason` |
