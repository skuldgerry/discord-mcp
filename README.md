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
- Create/delete text channels
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
- **Category Management**: Create, edit, and delete channel categories

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
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
- [Development](#development)
- [License](#license)
- [Attribution](#attribution)

## Compatibility

- Node.js 22 or newer
- Discord API v10 through `discord.js` 14.27
- Model Context Protocol through `@modelcontextprotocol/sdk` 1.29, including the stable 2025-11-25 protocol revision
- Stateless Streamable HTTP and stdio transports share the same handler registry

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
- Permissions required in your Discord server:

  #### Easiest Setup
  - Administrator (Recommended for quick setup and full functionality)

  #### Or, select only the required permissions:
  - Send Messages
  - Send Polls
  - Pin Messages
  - Create Public Threads
  - Send Messages in Threads
  - Manage Messages
  - Manage Threads
  - Manage Channels
  - Manage Webhooks
  - Add Reactions
  - View Channel
  - Kick Members
  - Ban Members
  - Manage Roles
  - Manage Nicknames
  - Move Members
  - Mute Members
  - Deafen Members
  - Manage Emojis and Stickers
  - Create Instant Invite
  - View Audit Log

- Add your Discord bot to your server
  - To add your Discord bot to your server, use one of the following invite links (replace `INSERT_CLIENT_ID_HERE` with your bot's client ID):
    - **Administrator (full access):**
        https://discord.com/oauth2/authorize?client_id=INSERT_CLIENT_ID_HERE&scope=bot&permissions=8
    - **Custom permissions (minimum required):**
        https://discord.com/oauth2/authorize?client_id=INSERT_CLIENT_ID_HERE&scope=bot&permissions=52076489808

> **Note:**  
> According to Discord's security model, a bot can only access information from servers it has been explicitly added to.  
> If you want to use this MCP server to access a specific Discord server, you must add the bot to that server first.  
> Use the invite link below to add the bot to your target server.

## Installation

### Installing via NPM

You can use it with the following command:
```bash
npx mcp-discord --config ${DISCORD_TOKEN}
```

For more details, you can check out the [NPM Package](https://www.npmjs.com/package/mcp-discord).

### Installing via Docker

You can run the enhanced mcp-discord using Docker with a multi-stage build for optimal size.

```bash
# Build the image
docker build -t skuldgerry/discord-mcp:1.4.0 .

# Run locally with the Discord token supplied only at runtime
docker run --rm --name mcp-discord \
  -e DISCORD_TOKEN=your_discord_bot_token \
  -p 127.0.0.1:8080:8080 \
  skuldgerry/discord-mcp:1.4.0
```

**Features:**
- Multi-stage Docker build for minimal image size
- Production dependencies only in final image
- Runs as the unprivileged `node` user
- Built-in health check at `/healthz`
- HTTP transport on port 8080 by default

The loopback port binding keeps the unauthenticated HTTP endpoint local to the Docker host. For a trusted LAN deployment, replace `127.0.0.1:8080:8080` with `8080:8080`.

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

### Docker

You can use Docker containers with both Claude and Cursor:

```json
{
    "mcpServers": {
        "discord": {
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-e",
                "DISCORD_TOKEN=your_discord_bot_token",
                "-p",
                "8080:8080",
                "skuldgerry/discord-mcp:1.4.0",
                "--transport",
                "http",
                "--port",
                "8080"
            ]
        }
    }
}
```

### Claude

1. Using stdio transport:
```json
{
    "mcpServers": {
        "discord": {
            "command": "node",
            "args": [
                "path/to/discord-mcp/build/index.js",
                "--config",
                "your_discord_bot_token"
            ]
        }
    }
}
```

2. Using streamable HTTP transport:
```json
{
    "mcpServers": {
        "discord": {
            "command": "node",
            "args": [
                "path/to/discord-mcp/build/index.js",
                "--transport",
                "http",
                "--port",
                "3000",
                "--config",
                "your_discord_bot_token"
            ]
        }
    }
}
```

### Cursor

1. Using stdio transport:
```json
{
    "mcpServers": {
        "discord": {
            "command": "cmd",
            "args": [
                "/c",
                "node",
                "path/to/discord-mcp/build/index.js",
                "--config",
                "your_discord_bot_token"
            ]
        }
    }
}
```

2. Using streamable HTTP transport:
```json
{
    "mcpServers": {
        "discord": {
            "command": "cmd",
            "args": [
                "/c",
                "node",
                "path/to/discord-mcp/build/index.js",
                "--transport",
                "http",
                "--port",
                "3000",
                "--config",
                "your_discord_bot_token"
            ]
        }
    }
}
```

## Tools Documentation

### Basic Functions

- `discord_login`: Login to Discord using the configured token
- `discord_list_servers`: List all Discord servers the bot is a member of
- `discord_send`: Send legacy text or typed Components V2 (Text Display, Media Gallery, Container, Separator, Section/Thumbnail, and link buttons), with allowed mention controls and silent delivery
- `discord_edit_message`: Edit text or Components V2 messages authored by the bot
- `discord_get_message`: Read one message including flags, components, attachments, embeds, and poll state
- `discord_get_bot_permissions`: Inspect effective bot permissions and common capabilities
- `discord_get_server_info`: Get Discord server information

### Channel Management

- `discord_create_text_channel`: Create a text channel
- `discord_delete_channel`: Delete a channel

### Forum Functions

- `discord_get_forum_channels`: Get a list of forum channels
- `discord_create_forum_post`: Create a forum post
- `discord_get_forum_post`: Get a forum post
- `discord_reply_to_forum`: Reply to a forum post
- `discord_delete_forum_post`: Delete a forum post

### Messages and Reactions

- `discord_read_messages`: Read channel messages, including Components V2, flags, attachments, embeds, and polls
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
- `discord_dm_member`: Send a direct message to a user

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
- `discord_edit_category`: Edit an existing category
- `discord_delete_category`: Delete a category

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
- 40+ additional Discord tools for comprehensive server management
- Enhanced moderation capabilities (kick, ban, timeout, softban, bulk operations)
- Complete role management system (create, edit, delete, assign, remove)
- Voice channel operations (disconnect, move, mute, deafen)
- Advanced channel management (slowmode, lock/unlock, pin/unpin)
- Member information and management tools
- Invite and emoji management
- Audit log access
- Improved error handling and type safety
- Multi-stage Docker build optimization

All modifications maintain compatibility with the original MCP protocol and Discord.js v14.
