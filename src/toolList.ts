export const toolList = [
  {
    name: "discord_create_category",
    description: "Creates a new category in a Discord server.",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        position: { type: "number" },
        reason: { type: "string" }
      },
      required: ["guildId", "name"]
    }
  },
  // Emojis
  {
    name: "discord_list_emojis",
    description: "List server emojis",
    inputSchema: { type: "object", properties: { guildId: { type: "string" } }, required: ["guildId"] }
  },
  {
    name: "discord_create_emoji",
    description: "Create a custom emoji from an image URL",
    inputSchema: { type: "object", properties: { guildId: { type: "string" }, name: { type: "string" }, imageUrl: { type: "string" }, reason: { type: "string" } }, required: ["guildId", "name", "imageUrl"] }
  },
  {
    name: "discord_delete_emoji",
    description: "Delete a custom emoji",
    inputSchema: { type: "object", properties: { guildId: { type: "string" }, emojiId: { type: "string" }, reason: { type: "string" } }, required: ["guildId", "emojiId"] }
  },
  // Roles list
  {
    name: "discord_list_roles",
    description: "List all roles in a server",
    inputSchema: { type: "object", properties: { guildId: { type: "string" } }, required: ["guildId"] }
  },
  // Channel extras
  {
    name: "discord_set_slowmode",
    description: "Set channel slowmode in seconds",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" }, rateLimitPerUserSeconds: { type: "number" }, reason: { type: "string" } },
      required: ["channelId", "rateLimitPerUserSeconds"]
    }
  },
  {
    name: "discord_lock_channel",
    description: "Deny @everyone from sending messages",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" }, reason: { type: "string" } },
      required: ["channelId"]
    }
  },
  {
    name: "discord_unlock_channel",
    description: "Restore @everyone default send messages permission",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" }, reason: { type: "string" } },
      required: ["channelId"]
    }
  },
  // Pins
  {
    name: "discord_pin_message",
    description: "Pin a message in a channel",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" }, messageId: { type: "string" } },
      required: ["channelId", "messageId"]
    }
  },
  {
    name: "discord_unpin_message",
    description: "Unpin a message in a channel",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" }, messageId: { type: "string" } },
      required: ["channelId", "messageId"]
    }
  },
  // Softban
  {
    name: "discord_softban_member",
    description: "Ban then immediately unban to purge messages",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" }, deleteMessageDays: { type: "number" }, reason: { type: "string" } },
      required: ["guildId", "userId"]
    }
  },
  // DMs
  {
    name: "discord_dm_member",
    description: "Send a direct message to a user",
    inputSchema: {
      type: "object",
      properties: { userId: { type: "string" }, message: { type: "string" } },
      required: ["userId", "message"]
    }
  },
  // Channel invites and vanity
  {
    name: "discord_get_channel_invites",
    description: "List invites for a specific channel",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" } },
      required: ["channelId"]
    }
  },
  {
    name: "discord_get_vanity_url",
    description: "Get server vanity URL if available",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" } },
      required: ["guildId"]
    }
  },
  // Voice operations
  {
    name: "discord_disconnect_voice",
    description: "Disconnects a member from their current voice channel",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" }, reason: { type: "string" } },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_move_voice",
    description: "Moves a member to a specific voice channel",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" }, channelId: { type: "string" }, reason: { type: "string" } },
      required: ["guildId", "userId", "channelId"]
    }
  },
  {
    name: "discord_voice_mute",
    description: "Server mute or unmute a member in voice",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" }, mute: { type: "boolean" }, reason: { type: "string" } },
      required: ["guildId", "userId", "mute"]
    }
  },
  {
    name: "discord_voice_deafen",
    description: "Server deafen or undeafen a member in voice",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" }, deafen: { type: "boolean" }, reason: { type: "string" } },
      required: ["guildId", "userId", "deafen"]
    }
  },
  // Member info
  {
    name: "discord_get_member_info",
    description: "Gets detailed member data",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" } },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_list_members",
    description: "Lists members in a server, with optional limit and query",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, limit: { type: "number" }, query: { type: "string" } },
      required: ["guildId"]
    }
  },
  // Moderation extras
  {
    name: "discord_remove_timeout",
    description: "Removes an active timeout from a member",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" }, reason: { type: "string" } },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_bulk_delete",
    description: "Bulk delete recent messages with optional filters",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" }, count: { type: "number" }, filterUserId: { type: "string" }, filterContains: { type: "string" }, reason: { type: "string" } },
      required: ["channelId", "count"]
    }
  },
  {
    name: "discord_set_nickname",
    description: "Set or clear a member nickname",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, userId: { type: "string" }, nickname: { type: "string" }, reason: { type: "string" } },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_get_bans",
    description: "List banned users",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" } },
      required: ["guildId"]
    }
  },
  // Invites
  {
    name: "discord_create_invite",
    description: "Create an invite link for a channel",
    inputSchema: {
      type: "object",
      properties: { channelId: { type: "string" }, maxAgeSeconds: { type: "number" }, maxUses: { type: "number" }, temporary: { type: "boolean" }, reason: { type: "string" } },
      required: ["channelId"]
    }
  },
  {
    name: "discord_get_invites",
    description: "List server invites",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" } },
      required: ["guildId"]
    }
  },
  // Audit logs
  {
    name: "discord_get_audit_logs",
    description: "Fetch server audit logs",
    inputSchema: {
      type: "object",
      properties: { guildId: { type: "string" }, limit: { type: "number" }, actionType: { type: "number" }, userId: { type: "string" } },
      required: ["guildId"]
    }
  },
  {
    name: "discord_edit_category",
    description: "Edits an existing Discord category (name and position).",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: { type: "string" },
        name: { type: "string" },
        position: { type: "number" },
        reason: { type: "string" }
      },
      required: ["categoryId"]
    }
  },
  {
    name: "discord_delete_category",
    description: "Deletes a Discord category by ID.",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["categoryId"]
    }
  },
  {
    name: "discord_login",
    description: "Logs in to Discord using the configured token",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string" }
      },
      required: []
    }
  },
  {
    name: "discord_send",
    description: "Sends a message to a specified Discord text channel",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        message: { type: "string" }
      },
      required: ["channelId", "message"]
    }
  },
  {
    name: "discord_get_forum_channels",
    description: "Lists all forum channels in a specified Discord server (guild)",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" }
      },
      required: ["guildId"]
    }
  },
  {
    name: "discord_create_forum_post",
    description: "Creates a new post in a Discord forum channel with optional tags",
    inputSchema: {
      type: "object",
      properties: {
        forumChannelId: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        tags: { 
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["forumChannelId", "title", "content"]
    }
  },
  {
    name: "discord_get_forum_post",
    description: "Retrieves details about a forum post including its messages",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string" }
      },
      required: ["threadId"]
    }
  },
  {
    name: "discord_reply_to_forum",
    description: "Adds a reply to an existing forum post or thread",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string" },
        message: { type: "string" }
      },
      required: ["threadId", "message"]
    }
  },
  {
    name: "discord_create_text_channel",
    description: "Creates a new text channel in a Discord server with an optional topic",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        channelName: { type: "string" },
        topic: { type: "string" }
      },
      required: ["guildId", "channelName"]
    }
  },
  {
    name: "discord_delete_channel",
    description: "Deletes a Discord channel with an optional reason",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["channelId"]
    }
  },
  {
    name: "discord_read_messages",
    description: "Retrieves messages from a Discord text channel with a configurable limit",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 100,
          default: 50
        }
      },
      required: ["channelId"]
    }
  },
  {
    name: "discord_get_server_info",
    description: "Retrieves detailed information about a Discord server including channels and member count",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" }
      },
      required: ["guildId"]
    }
  },
  {
    name: "discord_add_reaction",
    description: "Adds an emoji reaction to a specific Discord message",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        emoji: { type: "string" }
      },
      required: ["channelId", "messageId", "emoji"]
    }
  },
  {
    name: "discord_add_multiple_reactions",
    description: "Adds multiple emoji reactions to a Discord message at once",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        emojis: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["channelId", "messageId", "emojis"]
    }
  },
  {
    name: "discord_remove_reaction",
    description: "Removes a specific emoji reaction from a Discord message",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        emoji: { type: "string" },
        userId: { type: "string" }
      },
      required: ["channelId", "messageId", "emoji"]
    }
  },
  {
    name: "discord_delete_forum_post",
    description: "Deletes a forum post or thread with an optional reason",
    inputSchema: {
      type: "object",
      properties: {
        threadId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["threadId"]
    }
  },
  {
    name: "discord_delete_message",
    description: "Deletes a specific message from a Discord text channel",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        messageId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["channelId", "messageId"]
    }
  },
  {
    name: "discord_create_webhook",
    description: "Creates a new webhook for a Discord channel",
    inputSchema: {
      type: "object",
      properties: {
        channelId: { type: "string" },
        name: { type: "string" },
        avatar: { type: "string" },
        reason: { type: "string" }
      },
      required: ["channelId", "name"]
    }
  },
  {
    name: "discord_send_webhook_message",
    description: "Sends a message to a Discord channel using a webhook",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "string" },
        webhookToken: { type: "string" },
        content: { type: "string" },
        username: { type: "string" },
        avatarURL: { type: "string" },
        threadId: { type: "string" }
      },
      required: ["webhookId", "webhookToken", "content"]
    }
  },
  {
    name: "discord_edit_webhook",
    description: "Edits an existing webhook for a Discord channel",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "string" },
        webhookToken: { type: "string" },
        name: { type: "string" },
        avatar: { type: "string" },
        channelId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["webhookId"]
    }
  },
  {
    name: "discord_delete_webhook",
    description: "Deletes an existing webhook for a Discord channel",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "string" },
        webhookToken: { type: "string" },
        reason: { type: "string" }
      },
      required: ["webhookId"]
    }
  },
  {
    name: "discord_list_servers",
    description: "Lists all Discord servers the bot is a member of",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  // Moderation tools
  {
    name: "discord_kick_member",
    description: "Kicks a member from a guild",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_ban_member",
    description: "Bans a member from a guild",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        deleteMessageDays: { type: "number" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_unban_member",
    description: "Unbans a user in a guild",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_timeout_member",
    description: "Timeouts a member for a duration in minutes",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        durationMinutes: { type: "number" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId", "durationMinutes"]
    }
  },
  {
    name: "discord_disconnect_member",
    description: "Disconnects a member from their current voice channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId"]
    }
  },
  {
    name: "discord_move_member",
    description: "Moves a member to a specific voice channel",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        channelId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId", "channelId"]
    }
  },
  // Role tools
  {
    name: "discord_add_role",
    description: "Adds a role to a member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        roleId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId", "roleId"]
    }
  },
  {
    name: "discord_remove_role",
    description: "Removes a role from a member",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        userId: { type: "string" },
        roleId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["guildId", "userId", "roleId"]
    }
  },
  {
    name: "discord_create_role",
    description: "Creates a role in a guild",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        name: { type: "string" },
        color: { type: "string" },
        hoist: { type: "boolean" },
        mentionable: { type: "boolean" },
        permissions: { type: "array", items: { type: "string" } },
        reason: { type: "string" }
      },
      required: ["guildId", "name"]
    }
  },
  {
    name: "discord_edit_role",
    description: "Edits a role in a guild",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        roleId: { type: "string" },
        name: { type: "string" },
        color: { type: "string" },
        hoist: { type: "boolean" },
        mentionable: { type: "boolean" },
        permissions: { type: "array", items: { type: "string" } },
        reason: { type: "string" }
      },
      required: ["guildId", "roleId"]
    }
  },
  {
    name: "discord_delete_role",
    description: "Deletes a role in a guild",
    inputSchema: {
      type: "object",
      properties: {
        guildId: { type: "string" },
        roleId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["guildId", "roleId"]
    }
  }
]; 