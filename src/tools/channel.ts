import { z } from "zod";
import { ChannelType, PermissionsBitField } from "discord.js";
import { ToolContext, ToolResponse } from "./types.js";
import { 
  CreateTextChannelSchema, 
  DeleteChannelSchema, 
  ReadMessagesSchema,
  GetServerInfoSchema,
  CreateCategorySchema,
  EditCategorySchema,
  EditChannelSchema,
  SetChannelPermissionOverwritesSchema,
  CutoverCategoriesSchema,
  DeleteCategorySchema,
  ListServersSchema,
  PermissionOverwriteSchema
} from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { SetSlowmodeSchema, LockChannelSchema, UnlockChannelSchema } from "../schemas.js";

type PermissionOverwriteInput = z.infer<typeof PermissionOverwriteSchema>;

function toPermissionOverwrites(overwrites: PermissionOverwriteInput[]) {
  return overwrites.map(overwrite => {
    // Resolve eagerly so invalid Discord permission names fail before any API mutation.
    const allow = new PermissionsBitField((overwrite.allow ?? []) as any);
    const deny = new PermissionsBitField((overwrite.deny ?? []) as any);
    return {
      id: overwrite.id,
      type: overwrite.type === "role" ? 0 : 1,
      allow,
      deny
    };
  });
}

function resolveParentId(input: {
  parentId?: string | null;
  categoryId?: string | null;
}): string | null | undefined {
  return input.parentId !== undefined ? input.parentId : input.categoryId;
}

function structured(summary: string, data: Record<string, unknown>): ToolResponse {
  return {
    content: [{ type: "text", text: `${summary}\n${JSON.stringify(data, null, 2)}` }],
    structuredContent: data
  };
}

  // Category creation handler
export async function createCategoryHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const { guildId, name, position, permissionOverwrites, reason } = CreateCategorySchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
        isError: true
      };
    }
    const options: any = { name, type: ChannelType.GuildCategory };
    if (typeof position === "number") options.position = position;
    if (permissionOverwrites !== undefined) {
      options.permissionOverwrites = toPermissionOverwrites(permissionOverwrites);
    }
    if (reason) options.reason = reason;
    const category = await guild.channels.create(options);
    return structured(`Successfully created category "${name}".`, {
      guildId: guild.id,
      categoryId: category.id,
      channelId: category.id,
      position: category.position
    });
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Category edit handler
export async function editCategoryHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const { categoryId, name, position, permissionOverwrites, reason } = EditCategorySchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }
    const category = await context.client.channels.fetch(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return {
        content: [{ type: "text", text: `Cannot find category with ID: ${categoryId}` }],
        isError: true
      };
    }
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (typeof position === "number") update.position = position;
    if (permissionOverwrites !== undefined) {
      update.permissionOverwrites = toPermissionOverwrites(permissionOverwrites);
    }
    if (reason) update.reason = reason;
    const edited = await category.edit(update);
    return structured("Successfully edited category.", {
      guildId: edited.guild.id,
      categoryId: edited.id,
      channelId: edited.id,
      position: edited.position
    });
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Category deletion handler
export async function deleteCategoryHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const { categoryId, reason } = DeleteCategorySchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }
    const category = await context.client.channels.fetch(categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return {
        content: [{ type: "text", text: `Cannot find category with ID: ${categoryId}` }],
        isError: true
      };
    }
    await category.delete(reason || "Category deleted via API");
    return {
      content: [{ type: "text", text: `Successfully deleted category with ID: ${categoryId}` }]
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

  // Text channel creation handler
export async function createTextChannelHandler(
  args: unknown, 
  context: ToolContext
): Promise<ToolResponse> {
  const parsed = CreateTextChannelSchema.parse(args);
  const {
    guildId,
    channelName,
    topic,
    position,
    permissionOverwrites,
    reason
  } = parsed;
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
        isError: true
      };
    }

    // Create the text channel
    const channelOptions: any = {
      name: channelName,
      type: ChannelType.GuildText
    };
    if (topic) channelOptions.topic = topic;
    const parentId = resolveParentId(parsed);
    if (parentId !== undefined) channelOptions.parent = parentId;
    if (position !== undefined) channelOptions.position = position;
    if (permissionOverwrites !== undefined) {
      channelOptions.permissionOverwrites = toPermissionOverwrites(permissionOverwrites);
    }
    if (reason) channelOptions.reason = reason;
    const channel = await guild.channels.create(channelOptions);

    return structured(`Successfully created text channel "${channelName}".`, {
      guildId: guild.id,
      channelId: channel.id,
      parentId: channel.parentId,
      categoryId: channel.parentId,
      position: channel.position
    });
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function editChannelHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const parsed = EditChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const channel = await context.client.channels.fetch(parsed.channelId);
    if (!channel || !("edit" in channel) || !("guild" in channel)) {
      return {
        content: [{ type: "text", text: `Cannot find editable guild channel with ID: ${parsed.channelId}` }],
        isError: true
      };
    }

    const update: any = {};
    if (parsed.name !== undefined) update.name = parsed.name;
    if (parsed.topic !== undefined) update.topic = parsed.topic;
    const parentId = resolveParentId(parsed);
    if (parentId !== undefined) update.parent = parentId;
    if (parsed.position !== undefined) update.position = parsed.position;
    if (parsed.permissionOverwrites !== undefined) {
      update.permissionOverwrites = toPermissionOverwrites(parsed.permissionOverwrites);
    }
    if (parsed.reason) update.reason = parsed.reason;

    const edited = await channel.edit(update);
    return structured("Successfully edited channel.", {
      guildId: edited.guild.id,
      channelId: edited.id,
      parentId: "parentId" in edited ? edited.parentId : null,
      categoryId: "parentId" in edited ? edited.parentId : null,
      position: "position" in edited ? edited.position : null
    });
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function setChannelPermissionOverwritesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const { channelId, permissionOverwrites, reason } =
    SetChannelPermissionOverwritesSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !("permissionOverwrites" in channel) || !("guild" in channel)) {
      return {
        content: [{ type: "text", text: `Channel not found or cannot set overwrites: ${channelId}` }],
        isError: true
      };
    }

    await channel.permissionOverwrites.set(toPermissionOverwrites(permissionOverwrites), reason);
    return structured("Channel permission overwrites replaced.", {
      guildId: channel.guild.id,
      channelId,
      overwriteCount: permissionOverwrites.length
    });
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function cutoverCategoriesHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const parsed = CutoverCategoriesSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const [oldCategory, newCategory] = await Promise.all([
      context.client.channels.fetch(parsed.oldCategoryId),
      context.client.channels.fetch(parsed.newCategoryId)
    ]);
    if (!oldCategory || oldCategory.type !== ChannelType.GuildCategory) {
      throw new Error(`Cannot find old category with ID: ${parsed.oldCategoryId}`);
    }
    if (!newCategory || newCategory.type !== ChannelType.GuildCategory) {
      throw new Error(`Cannot find new category with ID: ${parsed.newCategoryId}`);
    }
    if (oldCategory.guild.id !== newCategory.guild.id) {
      throw new Error("Old and new categories must belong to the same guild");
    }
    const oldEveryoneOverwrite = parsed.oldPermissionOverwrites.find(overwrite =>
      overwrite.type === "role" && overwrite.id === oldCategory.guild.id
    );
    if (!oldEveryoneOverwrite?.deny?.includes("ViewChannel")) {
      throw new Error(
        "oldPermissionOverwrites must deny ViewChannel to the guild @everyone role"
      );
    }

    // Safety order: hide/archive the old category first. If a later request fails,
    // the migration remains private rather than exposing the new WIP category.
    await oldCategory.permissionOverwrites.set(
      toPermissionOverwrites(parsed.oldPermissionOverwrites),
      parsed.reason
    );
    await oldCategory.guild.channels.setPositions([
      { channel: oldCategory.id, position: parsed.oldPosition },
      { channel: newCategory.id, position: parsed.newPosition }
    ]);
    await newCategory.permissionOverwrites.set(
      toPermissionOverwrites(parsed.newPermissionOverwrites),
      parsed.reason
    );

    return structured("Category cutover completed in privacy-safe order.", {
      guildId: oldCategory.guild.id,
      oldCategoryId: oldCategory.id,
      newCategoryId: newCategory.id,
      oldPosition: parsed.oldPosition,
      newPosition: parsed.newPosition,
      safetyOrder: ["hideOld", "reposition", "revealNew"]
    });
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Channel deletion handler
export async function deleteChannelHandler(
  args: unknown, 
  context: ToolContext
): Promise<ToolResponse> {
  const { channelId, reason } = DeleteChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: `Cannot find channel with ID: ${channelId}` }],
        isError: true
      };
    }

    // Check if channel can be deleted (has delete method)
    if (!('delete' in channel)) {
      return {
        content: [{ type: "text", text: `This channel type does not support deletion or the bot lacks permissions` }],
        isError: true
      };
    }

    // Delete the channel
    await channel.delete(reason || "Channel deleted via API");

    return {
      content: [{ 
        type: "text", 
        text: `Successfully deleted channel with ID: ${channelId}` 
      }]
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Message reading handler
export async function readMessagesHandler(
  args: unknown, 
  context: ToolContext
): Promise<ToolResponse> {
  const { channelId, limit } = ReadMessagesSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const channel = await context.client.channels.fetch(channelId);
    if (!channel) {
      return {
        content: [{ type: "text", text: `Cannot find channel with ID: ${channelId}` }],
        isError: true
      };
    }

    // Check if channel has messages (text channel, thread, etc.)
    if (!channel.isTextBased() || !('messages' in channel)) {
      return {
        content: [{ type: "text", text: `Channel type does not support reading messages` }],
        isError: true
      };
    }

    // Fetch messages
    const messages = await channel.messages.fetch({ limit });
    
    if (messages.size === 0) {
      return {
        content: [{ type: "text", text: `No messages found in channel` }]
      };
    }

    // Format messages 
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        bot: msg.author.bot
      },
      timestamp: msg.createdAt.toISOString(),
      editedAt: msg.editedAt?.toISOString() ?? null,
      flags: msg.flags.toArray(),
      pinned: msg.pinned,
      components: msg.components.map(component => component.toJSON()),
      attachments: msg.attachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        contentType: attachment.contentType,
        size: attachment.size
      })),
      embeds: msg.embeds.map(embed => embed.toJSON()),
      poll: msg.poll ? {
        question: msg.poll.question.text,
        expiresAt: msg.poll.expiresAt?.toISOString() ?? null,
        allowMultiselect: msg.poll.allowMultiselect,
        finalized: msg.poll.resultsFinalized,
        answers: msg.poll.answers.map(answer => ({
          id: answer.id,
          text: answer.text,
          emoji: answer.emoji?.identifier ?? null,
          votes: answer.voteCount
        }))
      } : null,
      replyTo: msg.reference ? msg.reference.messageId : null
    })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const data = {
      channelId,
      messageCount: formattedMessages.length,
      messages: formattedMessages
    };
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(data, null, 2)
      }],
      structuredContent: data
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Server information handler
export async function getServerInfoHandler(
  args: unknown, 
  context: ToolContext
): Promise<ToolResponse> {
  const { guildId } = GetServerInfoSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return {
        content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
        isError: true
      };
    }

    // Fetch additional server data
    await guild.fetch();
    
    // Fetch channel information
    const channels = await guild.channels.fetch();
    
    // Categorize channels by type
    const channelsByType = {
      text: channels.filter(c => c?.type === ChannelType.GuildText).size,
      voice: channels.filter(c => c?.type === ChannelType.GuildVoice).size,
      category: channels.filter(c => c?.type === ChannelType.GuildCategory).size,
      forum: channels.filter(c => c?.type === ChannelType.GuildForum).size,
      announcement: channels.filter(c => c?.type === ChannelType.GuildAnnouncement).size,
      stage: channels.filter(c => c?.type === ChannelType.GuildStageVoice).size,
      total: channels.size
    };

    // Get detailed information for all channels
    const channelDetails = channels.map(channel => {
      if (!channel) return null;
      
      return {
        id: channel.id,
        name: channel.name,
        type: ChannelType[channel.type] || channel.type,
        categoryId: channel.parentId,
        position: channel.position,
        // Only add topic for text channels
        topic: 'topic' in channel ? channel.topic : null,
      };
    }).filter(c => c !== null); // Filter out null values
    
    // Group channels by type
    const groupedChannels = {
      text: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildText] || c.type === ChannelType.GuildText),
      voice: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildVoice] || c.type === ChannelType.GuildVoice),
      category: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildCategory] || c.type === ChannelType.GuildCategory),
      forum: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildForum] || c.type === ChannelType.GuildForum),
      announcement: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildAnnouncement] || c.type === ChannelType.GuildAnnouncement),
      stage: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildStageVoice] || c.type === ChannelType.GuildStageVoice),
      all: channelDetails
    };
    
    // Get member count
    const approximateMemberCount = guild.approximateMemberCount || "unknown";
    
    // Format guild information
    const guildInfo = {
      id: guild.id,
      name: guild.name,
      description: guild.description,
      icon: guild.iconURL(),
      owner: guild.ownerId,
      createdAt: guild.createdAt,
      memberCount: approximateMemberCount,
      channels: {
        count: channelsByType,
        details: groupedChannels
      },
      features: guild.features,
      premium: {
        tier: guild.premiumTier,
        subscriptions: guild.premiumSubscriptionCount
      }
    };

    return {
      content: [{ type: "text", text: JSON.stringify(guildInfo, null, 2) }]
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// List servers handler
export async function listServersHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  ListServersSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
      };
    }

    const guilds = await context.client.guilds.fetch();
    
    if (guilds.size === 0) {
      return {
        content: [{ type: "text", text: "No servers found. The bot is not a member of any servers." }]
      };
    }

    const guildsInfo = guilds.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL()
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(guildsInfo, null, 2) }]
    };
  } catch (error) {
    return handleDiscordError(error);
  }
} 

// Set channel slowmode
export async function setSlowmodeHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const { channelId, rateLimitPerUserSeconds, reason } = SetSlowmodeSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !('rateLimitPerUser' in channel) || !('edit' in channel)) {
      return { content: [{ type: "text", text: `Channel type does not support slowmode: ${channelId}` }], isError: true };
    }
    await (channel as any).edit({ rateLimitPerUser: rateLimitPerUserSeconds, reason });
    return { content: [{ type: "text", text: `Set slowmode to ${rateLimitPerUserSeconds}s for ${channelId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Lock channel (deny @everyone SEND_MESSAGES)
export async function lockChannelHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const { channelId, reason } = LockChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !('permissionOverwrites' in channel)) {
      return { content: [{ type: "text", text: `Channel not found or cannot set overwrites: ${channelId}` }], isError: true };
    }
    const everyone = (channel as any).guild.roles.everyone;
    await (channel as any).permissionOverwrites.edit(everyone, { SendMessages: false }, { reason });
    return { content: [{ type: "text", text: `Locked channel ${channelId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

// Unlock channel (allow @everyone SEND_MESSAGES)
export async function unlockChannelHandler(
  args: unknown,
  context: ToolContext
): Promise<ToolResponse> {
  const { channelId, reason } = UnlockChannelSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !('permissionOverwrites' in channel)) {
      return { content: [{ type: "text", text: `Channel not found or cannot set overwrites: ${channelId}` }], isError: true };
    }
    const everyone = (channel as any).guild.roles.everyone;
    await (channel as any).permissionOverwrites.edit(everyone, { SendMessages: null }, { reason });
    return { content: [{ type: "text", text: `Unlocked channel ${channelId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}
