# MCP-Discord (Enhanced)
![](https://badge.mcpx.dev?type=server 'MCP Server')

A comprehensive Discord MCP (Model Context Protocol) server that enables AI assistants to interact with the Discord platform. This is an enhanced fork of the original [mcp-discord](https://github.com/barryyip0625/mcp-discord) by [Barry Yip](https://github.com/barryyip0625) with extensive additional moderation, role management, voice operations, and administrative tools.

> **Note:** This is a modified version of the original repository, enhanced with AI assistance to add comprehensive Discord moderation and management capabilities. The original work by Barry Yip is preserved and properly attributed.

## Overview

MCP-Discord provides the following Discord-related functionalities:

- Login to Discord bot
- List servers the bot is a member of
- Get server information
- Read/delete channel messages
- Send legacy text or typed Discord Components V2 messages
- Edit messages authored by the bot
- Forward/crosspost messages and create/end/read native polls
- Inspect the bot's effective guild/channel permissions
- Retrieve forum channel lists
- Create/delete/reply to forum posts
- Create, move, edit, and delete text channels with category placement and permission overwrites
- Add/remove message reactions
- Create/edit/delete/use webhooks
- **Member Management**: Kick, ban, unban, timeout, softban members
- **Role Management**: Create, edit, delete, assign, and remove roles, including gradient role colors
- **Voice Operations**: Disconnect, move, mute, and deafen members in voice channels
- **Channel Management**: Set slowmode, lock/unlock channels, pin/unpin messages
- **Moderation Tools**: Bulk delete messages, set nicknames, view bans, audit logs
- **Member Information**: Get detailed member data, list server members, send DMs
- **Invite Management**: Create invites, list server/channel invites, get vanity URLs
- **Emoji Management**: Create, delete, and list custom emojis
- **Category Management**: Create, edit, secure, reposition, cut over, and delete channel categories

## Table of Contents

- [Compatibility](#compatibility)
- [Release and Versioning](#release-and-versioning)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage with Claude/Cursor](#usage-with-claudecursor)
- [Tools Documentation](#tools-documentation)
  - [Basic Functions](#basic-functions)
  - [Channel Management](#channel-management)
  - [Forum Functions](#forum-functions)
  - [Messages and Reactions](#messages-and-reactions)
  - [Webhook Management](#webhook-management)
  - [Member Management](#member-management)
  - [Role Management](#role-management)
  - [Voice Operations](#voice-operations)
  - [Moderation Tools](#moderation-tools)
  - [Member Information](#member-information)
  - [Invite Management](#invite-management)
  - [Emoji Management](#emoji-management)
  - [Category Management](#category-management)
  - [Channel Extras](#channel-extras)
- [Development](#development)
- [License](#license)
- [Attribution](#attribution)

## Compatibility

- Node.js 22 or newer
- Discord API v10 through `discord.js` 14.27
- Model Context Protocol through `@modelcontextprotocol/sdk` 1.29, including the stable 2025-11-25 protocol revision
- Stateless Streamable HTTP and stdio transports share the same handler registry

## Release and Versioning

The current enhanced-fork release is **2.2.1**. Version 2.2.0 was published on
2026-07-28; 2.2.1 refreshes dependencies and container packaging.

- Release history: [CHANGELOG.md](CHANGELOG.md)
- Version selection and release process: [VERSIONING.md](VERSIONING.md)

Use the immutable `skuldgerry/discord-mcp:2.2.1` tag for deployments. The `latest`
tag is updated only after validation on the dedicated remote builder.

## Prerequisites

- Node.js (v22.0.0 or higher)
- npm
- A Discord bot with appropriate permissions
  - Bot token (obtainable from the [Discord Developer Portal](https://discord.com/developers/applications))
  - Message Content Intent enabled
  - Server Members Intent enabled
  - Presence Intent enabled
  - Guild Bans Intent enabled
  - Guild Voice States Intent enabled
  - Guild Invites Intent enabled
  - Guild Moderation Intent enabled
- Permissions required in your Discord server depend on the tools you use:

  #### Easiest Setup
  - Administrator (Recommended for quick setup and full functionality)

  #### Suggested full feature set
  Grant only the permissions needed for the tools you intend to use:

  - Create Instant Invite
  - Kick Members
  - Ban Members
  - Manage Server
  - Manage Channels
  - Add Reactions
  - View Audit Log
  - View Channel
  - Send Messages
  - Read Message History
  - Send Polls
  - Pin Messages
  - Create Public Threads
  - Send Messages in Threads
  - Manage Messages
  - Manage Threads
  - Manage Webhooks
  - Manage Roles
  - Manage Nicknames
  - Moderate Members
  - Move Members
  - Mute Members
  - Deafen Members
  - Create Expressions
  - Manage Expressions
  - Use External Emojis
  - Mention Everyone (only if the bot must send `@everyone` or `@here`)

- Add your Discord bot to your server
  - To add your Discord bot to your server, use one of the following invite links (replace `INSERT_CLIENT_ID_HERE` with your bot's client ID):
    - **Administrator (full access):**
        https://discord.com/oauth2/authorize?client_id=INSERT_CLIENT_ID_HERE&scope=bot&permissions=8
    - **Suggested full feature set:**
        https://discord.com/oauth2/authorize?client_id=INSERT_CLIENT_ID_HERE&scope=bot&permissions=2824973832367351

> **Note:**  
> According to Discord's security model, a bot can only access information from servers it has been explicitly added to.  
> If you want to use this MCP server to access a specific Discord server, you must add the bot to that server first.  
> Use the invite link below to add the bot to your target server.

## Installation

### npm package status

This enhanced fork is not published under the `mcp-discord` package name. Running `npx mcp-discord` currently installs the [upstream npm package](https://www.npmjs.com/package/mcp-discord), which does not include this fork's Components V2 and newer tools. Use the Docker image or install from source instead.

### Installing via Docker

The public Docker image is available as `skuldgerry/discord-mcp:2.2.1`. You can pull it or build the same tag locally:

```bash
# Pull the published image
docker pull skuldgerry/discord-mcp:2.2.1

# Or build it locally
docker build -t skuldgerry/discord-mcp:2.2.1 .

# Run locally with the Discord token supplied only at runtime
docker run --rm --name mcp-discord \
  -e DISCORD_TOKEN=your_discord_bot_token \
  -p 127.0.0.1:8080:8080 \
  skuldgerry/discord-mcp:2.2.1
```

**Features:**
- Multi-stage Docker build for minimal image size
- Production dependencies only in final image
- Runs as the unprivileged `node` user
- Built-in health check at `/healthz`
- HTTP transport on port 8080 by default

The MCP endpoint is `http://127.0.0.1:8080/mcp`. The loopback port binding keeps the unauthenticated HTTP endpoint local to the Docker host. For a trusted LAN deployment, replace `127.0.0.1:8080:8080` with `8080:8080`.

### Manual Installation
```bash
# Clone this enhanced repository
git clone https://github.com/skuldgerry/discord-mcp.git
cd discord-mcp

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

## Configuration

A Discord bot token is required for proper operation. The server supports two transport methods: stdio and streamable HTTP.

### Transport Methods

1. **stdio** (Default)
   - Traditional stdio transport for basic usage
   - Suitable for simple integrations

2. **streamable HTTP**
   - HTTP-based transport for more advanced scenarios
   - Supports stateless operation
   - Configurable port number
   - Currently has no application-level authentication or Origin validation; expose it only on a trusted internal network

### Configuration Options

You can provide configuration in two ways:

1. Environment variables:
```bash
DISCORD_TOKEN=your_discord_bot_token
```

2. Using command line arguments:
```bash
# For stdio transport (default)
node build/index.js --config "your_discord_bot_token"

# For streamable HTTP transport
node build/index.js --transport http --port 3000 --config "your_discord_bot_token"
```

## Usage with Claude/Cursor

Command-based MCP configurations communicate with the launched process over stdio. Do not start an HTTP transport from a `"command"` entry.

### Docker over stdio

This configuration works with command-based clients and passes the token from the client process environment into the container:

```json
{
    "mcpServers": {
        "discord": {
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-i",
                "--no-healthcheck",
                "-e",
                "DISCORD_TOKEN",
                "skuldgerry/discord-mcp:2.2.1",
                "--transport",
                "stdio"
            ],
            "env": {
                "DISCORD_TOKEN": "your_discord_bot_token"
            }
        }
    }
}
```

`--no-healthcheck` disables the image's HTTP health check because this container is intentionally running in stdio mode.

### Claude over native stdio

```json
{
    "mcpServers": {
        "discord": {
            "command": "node",
            "args": [
                "path/to/discord-mcp/build/index.js"
            ],
            "env": {
                "DISCORD_TOKEN": "your_discord_bot_token"
            }
        }
    }
}
```

### Cursor over native stdio

```json
{
    "mcpServers": {
        "discord": {
            "command": "cmd",
            "args": [
                "/c",
                "node",
                "path/to/discord-mcp/build/index.js"
            ],
            "env": {
                "DISCORD_TOKEN": "your_discord_bot_token"
            }
        }
    }
}
```

### Streamable HTTP

Start the server independently with Docker as shown in [Installing via Docker](#installing-via-docker), or from source:

```bash
node build/index.js --transport http --port 8080 --config "your_discord_bot_token"
```

Configure URL-capable MCP clients to use `http://127.0.0.1:8080/mcp`. The exact URL configuration key depends on the client. This transport is stateless and accepts `POST` requests; `GET` and `DELETE` on `/mcp` return `405 Method Not Allowed`.

## Tools Documentation

### Basic Functions

- `discord_login`: Login to Discord using the configured token
- `discord_list_servers`: List all Discord servers the bot is a member of
- `discord_send`: Send legacy text or typed Components V2 (Text Display, Media Gallery, Container, Separator, Section/Thumbnail, and link buttons), including native replies, allowed mention controls, and silent delivery
- `discord_edit_message`: Edit text or Components V2 messages authored by the bot
- `discord_get_message`: Read one message including flags, components, attachments, embeds, and poll state
- `discord_get_bot_permissions`: Inspect effective bot permissions and common capabilities
- `discord_get_server_info`: Get Discord server information

### Channel Management

- `discord_create_text_channel`: Create a text channel with parent/category, position, and permission overwrites
- `discord_create_voice_channel`: Create a voice channel with hierarchy, bitrate, capacity, region, video quality, and permission overwrites
- `discord_edit_channel`: Rename, move, reposition, configure text/voice settings, replace permission overwrites, or move with Discord's native permission synchronization
- `discord_get_channel_info`: Inspect hierarchy, type-specific settings, normalized permission overwrites, and parent permission-sync state
- `discord_set_channel_permission_overwrites`: Replace all permission overwrites after channel creation
- `discord_delete_channel`: Delete a channel

### Forum Functions

- `discord_get_forum_channels`: Get a list of forum channels
- `discord_create_forum_post`: Create a forum post
- `discord_get_forum_post`: Get a forum post
- `discord_reply_to_forum`: Reply to a forum post
- `discord_delete_forum_post`: Delete a forum post

### Thread Management

- `discord_create_thread`: Create public/private threads, optionally from an existing message
- `discord_edit_thread`: Rename, archive, lock, configure auto-archive/slowmode, or change private-thread invite behavior

### Messages and Reactions

- `discord_read_messages`: Read channel messages with `before`, `after`, or `around` pagination, including Components V2, flags, attachments, embeds, and polls
- `discord_forward_message`: Forward a message using Discord's native message snapshot
- `discord_crosspost_message`: Publish a message from an Announcement channel
- `discord_send_poll`: Send a native Discord poll
- `discord_end_poll`: End a poll authored by the bot
- `discord_get_poll_voters`: List voters for a poll answer
- `discord_add_reaction`: Add a reaction to a message
- `discord_add_multiple_reactions`: Add multiple reactions to a message
- `discord_remove_reaction`: Remove a reaction from a message
- `discord_delete_message`: Delete a specific message from a channel

### Webhook Management

- `discord_create_webhook`: Creates a new webhook for a Discord channel
- `discord_send_webhook_message`: Sends a message to a Discord channel using a webhook
- `discord_edit_webhook`: Edits an existing webhook for a Discord channel
- `discord_delete_webhook`: Deletes an existing webhook for a Discord channel

### Member Management

- `discord_kick_member`: Kick a member from a guild
- `discord_ban_member`: Ban a member from a guild with optional message deletion
- `discord_unban_member`: Remove a ban from a user
- `discord_timeout_member`: Timeout a member for a specified duration
- `discord_remove_timeout`: Remove an active timeout from a member
- `discord_softban_member`: Ban then immediately unban to purge messages

### Role Management

- `discord_create_role`: Create a new role in a guild
- `discord_edit_role`: Edit an existing role
- `discord_delete_role`: Delete a role
- `discord_add_role`: Assign a role to a member
- `discord_remove_role`: Remove a role from a member
- `discord_list_roles`: List all roles in a server

### Voice Operations

- `discord_disconnect_voice`: Disconnect a member from their current voice channel
- `discord_move_voice`: Move a member to a specific voice channel
- `discord_voice_mute`: Server mute or unmute a member in voice
- `discord_voice_deafen`: Server deafen or undeafen a member in voice
- `discord_disconnect_member`: Legacy compatibility alias for `discord_disconnect_voice`
- `discord_move_member`: Legacy compatibility alias for `discord_move_voice`

### Moderation Tools

- `discord_bulk_delete`: Bulk delete recent messages with optional filters
- `discord_set_nickname`: Set or clear a member's nickname
- `discord_get_bans`: List all banned users in a server
- `discord_pin_message`: Pin a message in a channel
- `discord_unpin_message`: Unpin a message in a channel
- `discord_get_audit_logs`: Fetch server audit logs

### Member Information

- `discord_get_member_info`: Get detailed information about a specific member
- `discord_list_members`: List members in a server with optional filtering
- `discord_dm_member`: Send text or typed Components V2 DMs, including native replies, allowed mention controls, and silent delivery; returns channel/message IDs and URL

### Invite Management

- `discord_create_invite`: Create an invite link for a channel
- `discord_get_invites`: List all server invites
- `discord_get_channel_invites`: List invites for a specific channel
- `discord_get_vanity_url`: Get server vanity URL if available

### Emoji Management

- `discord_list_emojis`: List all custom emojis in a server
- `discord_create_emoji`: Create a custom emoji from an image URL
- `discord_delete_emoji`: Delete a custom emoji

### Category Management

- `discord_create_category`: Create a new channel category
- `discord_edit_category`: Edit category name, position, or permission overwrites
- `discord_cutover_categories`: Hide the old category, reposition both categories, then reveal the new category
- `discord_delete_category`: Delete a category

Permission overwrite inputs use `{ id, type, allow, deny }`, where `type` is
`role` or `member` and permission values use Discord names such as
`ViewChannel`. The guild ID is the `@everyone` role ID. This allows WIP
categories to deny `ViewChannel` to `@everyone` while allowing it to an Admin
role. The cutover operation requires the old-category overwrite set to deny
`ViewChannel` to `@everyone`, so a partial failure cannot expose WIP content.

### Channel Extras

- `discord_set_slowmode`: Set channel slowmode in seconds
- `discord_lock_channel`: Deny @everyone from sending messages
- `discord_unlock_channel`: Restore @everyone default send messages permission

## Development

```bash
# Development mode
npm run dev
```

## License

[MIT License](https://github.com/barryyip0625/mcp-discord?tab=MIT-1-ov-file)

## Attribution

This enhanced version is based on the original [mcp-discord](https://github.com/barryyip0625/mcp-discord) by [Barry Yip](https://github.com/barryyip0625). The original work is preserved and properly attributed under the MIT License.

### Modifications

This fork includes extensive enhancements added with AI assistance:
- 75 advertised Discord tools for comprehensive server management
- Enhanced moderation capabilities (kick, ban, timeout, softban, bulk operations)
- Complete role management system (create, edit, delete, assign, remove)
- Voice channel creation/configuration and member operations (disconnect, move, mute, deafen)
- Public/private thread creation and lifecycle management
- Advanced channel management (slowmode, lock/unlock, pin/unpin)
- Member information and management tools
- Invite and emoji management
- Audit log access
- Improved error handling and type safety
- Multi-stage Docker build optimization

All modifications use Discord API v10 through `discord.js` 14.27 and Model Context Protocol through `@modelcontextprotocol/sdk` 1.29.
