const discordIdSchema = {
  type: "string",
  pattern: "^\\d{17,20}$"
};

const httpUrlSchema = {
  type: "string",
  format: "uri",
  pattern: "^https?://"
};

const allowedMentionsSchema = {
  type: "object",
  description: "Discord allowed_mentions. Pass {} to suppress every mention.",
  additionalProperties: false,
  properties: {
    parse: {
      type: "array",
      maxItems: 3,
      uniqueItems: true,
      items: { type: "string", enum: ["roles", "users", "everyone"] }
    },
    users: { type: "array", maxItems: 100, items: discordIdSchema },
    roles: { type: "array", maxItems: 100, items: discordIdSchema },
    repliedUser: { type: "boolean" }
  }
};

const linkButtonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    label: { type: "string", minLength: 1, maxLength: 80 },
    url: httpUrlSchema,
    emoji: { type: "string" },
    disabled: { type: "boolean" }
  },
  required: ["label", "url"]
};

const textDisplaySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { const: "text_display" },
    content: { type: "string", minLength: 1, maxLength: 4000 }
  },
  required: ["type", "content"]
};

const mediaGallerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { const: "media_gallery" },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          url: httpUrlSchema,
          description: { type: "string", maxLength: 1024 },
          spoiler: { type: "boolean" }
        },
        required: ["url"]
      }
    }
  },
  required: ["type", "items"]
};

const separatorSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { const: "separator" },
    divider: { type: "boolean" },
    spacing: { type: "string", enum: ["small", "large"] }
  },
  required: ["type"]
};

const thumbnailSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { const: "thumbnail" },
    url: httpUrlSchema,
    description: { type: "string", maxLength: 1024 },
    spoiler: { type: "boolean" }
  },
  required: ["type", "url"]
};

const sectionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { const: "section" },
    text: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string", minLength: 1, maxLength: 4000 }
    },
    accessory: {
      oneOf: [
        thumbnailSchema,
        {
          ...linkButtonSchema,
          properties: {
            type: { const: "link_button" },
            ...linkButtonSchema.properties
          },
          required: ["type", "label", "url"]
        }
      ]
    }
  },
  required: ["type", "text", "accessory"]
};

const linkButtonsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { const: "link_buttons" },
    buttons: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: linkButtonSchema
    }
  },
  required: ["type", "buttons"]
};

const containerChildSchemas = [
  textDisplaySchema,
  mediaGallerySchema,
  separatorSchema,
  sectionSchema,
  linkButtonsSchema
];

const containerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { const: "container" },
    accentColor: { type: "integer", minimum: 0, maximum: 16777215 },
    spoiler: { type: "boolean" },
    components: {
      type: "array",
      minItems: 1,
      maxItems: 40,
      items: { oneOf: containerChildSchemas }
    }
  },
  required: ["type", "components"]
};

const componentsSchema = {
  type: "array",
  minItems: 1,
  maxItems: 40,
  items: {
    oneOf: [...containerChildSchemas, containerSchema]
  }
};

const messageResultSchema = {
  type: "object",
  properties: {
    channelId: { type: "string" },
    messageId: { type: "string" },
    url: { type: "string" }
  },
  required: ["channelId", "messageId", "url"]
};

const permissionOverwriteSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: discordIdSchema,
    type: { type: "string", enum: ["role", "member"] },
    allow: {
      type: "array",
      maxItems: 100,
      items: { type: "string" },
      description: "Discord permission names to allow, for example ViewChannel."
    },
    deny: {
      type: "array",
      maxItems: 100,
      items: { type: "string" },
      description: "Discord permission names to deny, for example ViewChannel."
    }
  },
  required: ["id", "type"]
};

const permissionOverwritesSchema = {
  type: "array",
  maxItems: 100,
  items: permissionOverwriteSchema,
  description: "Complete ordered overwrite set. Use the guild ID with type=role for @everyone."
};

const channelResultSchema = {
  type: "object",
  properties: {
    guildId: { type: "string" },
    channelId: { type: "string" },
    categoryId: { type: ["string", "null"] },
    parentId: { type: ["string", "null"] },
    position: { type: ["number", "null"] }
  },
  required: ["guildId", "channelId"]
};

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
        permissionOverwrites: permissionOverwritesSchema,
        reason: { type: "string" }
      },
      required: ["guildId", "name"]
    },
    outputSchema: channelResultSchema
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
    description: "Sends a DM using the same text or typed Components V2 model as discord_send, including Media Gallery, mention controls, and silent delivery.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        userId: discordIdSchema,
        message: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
          description: "Legacy text field retained for backward compatibility."
        },
        content: { type: "string", minLength: 1, maxLength: 2000 },
        components: componentsSchema,
        allowedMentions: allowedMentionsSchema,
        suppressNotifications: {
          type: "boolean",
          description: "Adds Discord's SUPPRESS_NOTIFICATIONS message flag."
        }
      },
      required: ["userId"],
      oneOf: [
        { required: ["message"] },
        { required: ["content"] },
        { required: ["components"] }
      ]
    },
    outputSchema: messageResultSchema
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
    description: "Edits an existing Discord category, including position and complete permission overwrites.",
    inputSchema: {
      type: "object",
      properties: {
        categoryId: { type: "string" },
        name: { type: "string" },
        position: { type: "number" },
        permissionOverwrites: permissionOverwritesSchema,
        reason: { type: "string" }
      },
      required: ["categoryId"]
    },
    outputSchema: channelResultSchema
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
    description: "Sends a Discord message. Supports legacy text, typed Components V2, empty allowed_mentions, and suppressed notifications.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        message: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
          description: "Legacy text field retained for backward compatibility."
        },
        content: { type: "string", minLength: 1, maxLength: 2000 },
        components: componentsSchema,
        allowedMentions: allowedMentionsSchema,
        suppressNotifications: {
          type: "boolean",
          description: "Adds Discord's SUPPRESS_NOTIFICATIONS message flag."
        }
      },
      required: ["channelId"],
      oneOf: [
        { required: ["message"] },
        { required: ["content"] },
        { required: ["components"] }
      ]
    },
    outputSchema: messageResultSchema
  },
  {
    name: "discord_edit_message",
    description: "Edits a message authored by this bot, using text or the same typed Components V2 model as discord_send.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        messageId: discordIdSchema,
        message: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
          description: "Legacy text field retained for consistency with discord_send."
        },
        content: { type: "string", minLength: 1, maxLength: 2000 },
        components: componentsSchema,
        allowedMentions: allowedMentionsSchema
      },
      required: ["channelId", "messageId"],
      oneOf: [
        { required: ["message"] },
        { required: ["content"] },
        { required: ["components"] }
      ]
    },
    outputSchema: messageResultSchema
  },
  {
    name: "discord_get_message",
    description: "Gets one Discord message with flags, Components V2, attachments, embeds, poll data, and bot editability.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        messageId: discordIdSchema
      },
      required: ["channelId", "messageId"]
    }
  },
  {
    name: "discord_get_bot_permissions",
    description: "Gets the bot's effective guild or channel permissions and common Discord capabilities.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        guildId: discordIdSchema,
        channelId: discordIdSchema
      },
      required: ["guildId"]
    }
  },
  {
    name: "discord_forward_message",
    description: "Forwards an existing Discord message to another channel using the native message snapshot.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        sourceChannelId: discordIdSchema,
        messageId: discordIdSchema,
        targetChannelId: discordIdSchema
      },
      required: ["sourceChannelId", "messageId", "targetChannelId"]
    },
    outputSchema: messageResultSchema
  },
  {
    name: "discord_crosspost_message",
    description: "Publishes a message from an Announcement channel.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        messageId: discordIdSchema
      },
      required: ["channelId", "messageId"]
    },
    outputSchema: messageResultSchema
  },
  {
    name: "discord_send_poll",
    description: "Sends a native Discord poll with typed answers, duration, mention controls, and optional silent delivery.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        question: { type: "string", minLength: 1, maxLength: 300 },
        answers: {
          type: "array",
          minItems: 2,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              text: { type: "string", minLength: 1, maxLength: 55 },
              emoji: { type: "string" }
            },
            required: ["text"]
          }
        },
        durationHours: { type: "integer", minimum: 1, maximum: 768 },
        allowMultiselect: { type: "boolean" },
        allowedMentions: allowedMentionsSchema,
        suppressNotifications: { type: "boolean" }
      },
      required: ["channelId", "question", "answers", "durationHours"]
    },
    outputSchema: messageResultSchema
  },
  {
    name: "discord_end_poll",
    description: "Ends a native Discord poll authored by this bot.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        messageId: discordIdSchema
      },
      required: ["channelId", "messageId"]
    },
    outputSchema: messageResultSchema
  },
  {
    name: "discord_get_poll_voters",
    description: "Lists users who voted for one answer in a native Discord poll.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        messageId: discordIdSchema,
        answerId: { type: "integer", minimum: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100 },
        after: discordIdSchema
      },
      required: ["channelId", "messageId", "answerId"]
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
    description: "Creates a text channel with optional parent/category, position, and permission overwrites.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        guildId: discordIdSchema,
        channelName: { type: "string", minLength: 1, maxLength: 100 },
        topic: { type: "string", maxLength: 1024 },
        parentId: {
          oneOf: [discordIdSchema, { type: "null" }],
          description: "Parent category ID; null creates at the guild root."
        },
        categoryId: {
          oneOf: [discordIdSchema, { type: "null" }],
          description: "Alias for parentId."
        },
        position: { type: "integer", minimum: 0 },
        permissionOverwrites: permissionOverwritesSchema,
        reason: { type: "string" }
      },
      required: ["guildId", "channelName"]
    },
    outputSchema: channelResultSchema
  },
  {
    name: "discord_edit_channel",
    description: "Edits or moves a guild channel, including parent/category, position, topic, and complete permission overwrites.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        name: { type: "string", minLength: 1, maxLength: 100 },
        topic: { type: ["string", "null"], maxLength: 1024 },
        parentId: {
          oneOf: [discordIdSchema, { type: "null" }],
          description: "New parent category, or null to move to the guild root."
        },
        categoryId: {
          oneOf: [discordIdSchema, { type: "null" }],
          description: "Alias for parentId."
        },
        position: { type: "integer", minimum: 0 },
        permissionOverwrites: permissionOverwritesSchema,
        reason: { type: "string" }
      },
      required: ["channelId"]
    },
    outputSchema: channelResultSchema
  },
  {
    name: "discord_set_channel_permission_overwrites",
    description: "Replaces all permission overwrites on a guild channel or category.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        channelId: discordIdSchema,
        permissionOverwrites: permissionOverwritesSchema,
        reason: { type: "string" }
      },
      required: ["channelId", "permissionOverwrites"]
    },
    outputSchema: channelResultSchema
  },
  {
    name: "discord_cutover_categories",
    description: "Performs a privacy-safe category cutover: hide the old category, reposition both, then reveal the new category.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        oldCategoryId: discordIdSchema,
        newCategoryId: discordIdSchema,
        oldPosition: { type: "integer", minimum: 0 },
        newPosition: { type: "integer", minimum: 0 },
        oldPermissionOverwrites: permissionOverwritesSchema,
        newPermissionOverwrites: permissionOverwritesSchema,
        reason: { type: "string" }
      },
      required: [
        "oldCategoryId",
        "newCategoryId",
        "oldPosition",
        "newPosition",
        "oldPermissionOverwrites",
        "newPermissionOverwrites"
      ]
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
        color: { type: "string", description: "Legacy primary color; prefer colors.primaryColor." },
        colors: {
          type: "object",
          additionalProperties: false,
          properties: {
            primaryColor: { oneOf: [{ type: "integer", minimum: 0, maximum: 16777215 }, { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }] },
            secondaryColor: { oneOf: [{ type: "integer", minimum: 0, maximum: 16777215 }, { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }, { type: "null" }] },
            tertiaryColor: { oneOf: [{ type: "integer", minimum: 0, maximum: 16777215 }, { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }, { type: "null" }] }
          },
          required: ["primaryColor"]
        },
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
        color: { type: "string", description: "Legacy primary color; prefer colors.primaryColor." },
        colors: {
          type: "object",
          additionalProperties: false,
          properties: {
            primaryColor: { oneOf: [{ type: "integer", minimum: 0, maximum: 16777215 }, { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }] },
            secondaryColor: { oneOf: [{ type: "integer", minimum: 0, maximum: 16777215 }, { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }, { type: "null" }] },
            tertiaryColor: { oneOf: [{ type: "integer", minimum: 0, maximum: 16777215 }, { type: "string", pattern: "^#[0-9a-fA-F]{6}$" }, { type: "null" }] }
          },
          required: ["primaryColor"]
        },
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
