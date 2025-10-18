import { z } from "zod";
import { ChannelType, PermissionsBitField, GuildMember, VoiceChannel, PermissionFlagsBits, OverwriteType } from "discord.js";
import { ToolContext, ToolResponse } from "./types.js";
import { 
  KickMemberSchema,
  BanMemberSchema,
  UnbanMemberSchema,
  TimeoutMemberSchema,
  DisconnectMemberSchema,
  MoveMemberSchema,
  RemoveTimeoutSchema,
  BulkDeleteMessagesSchema,
  SetNicknameSchema,
  GetBansSchema
} from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { SoftbanMemberSchema, PinMessageSchema, UnpinMessageSchema } from "../schemas.js";

export async function kickMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, reason } = KickMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const member = await guild.members.fetch(userId);
    if (!member) {
      return { content: [{ type: "text", text: `Cannot find member with ID: ${userId}` }], isError: true };
    }
    await member.kick(reason || "Kicked via API");
    return { content: [{ type: "text", text: `Kicked user ${userId} from guild ${guildId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function banMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, deleteMessageDays, reason } = BanMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    await guild.members.ban(userId, { deleteMessageSeconds: deleteMessageDays ? deleteMessageDays * 24 * 60 * 60 : undefined, reason });
    return { content: [{ type: "text", text: `Banned user ${userId} from guild ${guildId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function unbanMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, reason } = UnbanMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    await guild.members.unban(userId, reason);
    return { content: [{ type: "text", text: `Unbanned user ${userId} in guild ${guildId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function timeoutMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, durationMinutes, reason } = TimeoutMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const member = await guild.members.fetch(userId);
    if (!member) {
      return { content: [{ type: "text", text: `Cannot find member with ID: ${userId}` }], isError: true };
    }
    const timeoutMs = durationMinutes * 60 * 1000;
    await member.timeout(timeoutMs, reason || "Timed out via API");
    return { content: [{ type: "text", text: `Timed out user ${userId} for ${durationMinutes} minutes` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function disconnectMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, reason } = DisconnectMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const member = await guild.members.fetch(userId);
    if (!member) {
      return { content: [{ type: "text", text: `Cannot find member with ID: ${userId}` }], isError: true };
    }
    if (!member.voice?.channel) {
      return { content: [{ type: "text", text: `Member ${userId} is not in a voice channel` }], isError: true };
    }
    await member.voice.disconnect(reason || "Disconnected via API");
    return { content: [{ type: "text", text: `Disconnected user ${userId} from voice` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function moveMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, channelId, reason } = MoveMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const member = await guild.members.fetch(userId);
    if (!member) {
      return { content: [{ type: "text", text: `Cannot find member with ID: ${userId}` }], isError: true };
    }
    const channel = await guild.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return { content: [{ type: "text", text: `Target channel ${channelId} is not a voice channel` }], isError: true };
    }
    await member.voice.setChannel(channelId, reason || "Moved via API");
    return { content: [{ type: "text", text: `Moved user ${userId} to voice channel ${channelId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function removeTimeoutHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, reason } = RemoveTimeoutSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.timeout(null, reason || "Timeout removed via API");
    return { content: [{ type: "text", text: `Removed timeout for user ${userId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function bulkDeleteMessagesHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { channelId, count, filterUserId, filterContains, reason } = BulkDeleteMessagesSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !('messages' in channel)) {
      return { content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }], isError: true };
    }
    const fetched = await channel.messages.fetch({ limit: Math.min(100, count) });
    const toDelete = fetched.filter(m => {
      if (filterUserId && m.author.id !== filterUserId) return false;
      if (filterContains && !m.content.includes(filterContains)) return false;
      return true;
    });
    const textChannel = channel as any;
    if (typeof textChannel.bulkDelete !== 'function') {
      return { content: [{ type: "text", text: `Channel type does not support bulk delete` }], isError: true };
    }
    const deleted = await textChannel.bulkDelete(toDelete, true);
    return { content: [{ type: "text", text: `Deleted ${deleted.size} messages` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function setNicknameHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, nickname, reason } = SetNicknameSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.setNickname(nickname ?? null, reason || "Nickname set via API");
    return { content: [{ type: "text", text: `Updated nickname for ${userId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function getBansHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId } = GetBansSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    const bans = await guild.bans.fetch();
    const formatted = bans.map(b => ({ userId: b.user.id, username: b.user.tag, reason: b.reason || null }));
    return { content: [{ type: "text", text: JSON.stringify(formatted, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function softbanMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, deleteMessageDays, reason } = SoftbanMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    await guild.members.ban(userId, { deleteMessageSeconds: deleteMessageDays ? deleteMessageDays * 24 * 60 * 60 : 7 * 24 * 60 * 60, reason });
    await guild.members.unban(userId, "Softban - unban step");
    return { content: [{ type: "text", text: `Softbanned user ${userId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function pinMessageHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { channelId, messageId } = PinMessageSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !('messages' in channel)) return { content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }], isError: true };
    const msg = await (channel as any).messages.fetch(messageId);
    await msg.pin();
    return { content: [{ type: "text", text: `Pinned message ${messageId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function unpinMessageHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { channelId, messageId } = UnpinMessageSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !('messages' in channel)) return { content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }], isError: true };
    const msg = await (channel as any).messages.fetch(messageId);
    await msg.unpin();
    return { content: [{ type: "text", text: `Unpinned message ${messageId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}


