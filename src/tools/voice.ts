import { ChannelType } from "discord.js";
import { ToolContext, ToolResponse } from "./types.js";
import { DisconnectMemberSchema, MoveMemberSchema, VoiceMuteSchema, VoiceDeafenSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";

export async function disconnectVoiceHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, reason } = DisconnectMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    if (!member.voice?.channel) return { content: [{ type: "text", text: `Member ${userId} is not in a voice channel` }], isError: true };
    await member.voice.disconnect(reason || "Disconnected via API");
    return { content: [{ type: "text", text: `Disconnected user ${userId} from voice` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function moveVoiceHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, channelId, reason } = MoveMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    const channel = await guild.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice) return { content: [{ type: "text", text: `Target channel ${channelId} is not a voice channel` }], isError: true };
    await member.voice.setChannel(channelId, reason || "Moved via API");
    return { content: [{ type: "text", text: `Moved user ${userId} to voice channel ${channelId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function voiceMuteHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, mute, reason } = VoiceMuteSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.voice.setMute(mute, reason || (mute ? "Server mute via API" : "Server unmute via API"));
    return { content: [{ type: "text", text: `${mute ? 'Muted' : 'Unmuted'} user ${userId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function voiceDeafenHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, deafen, reason } = VoiceDeafenSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.voice.setDeaf(deafen, reason || (deafen ? "Server deafen via API" : "Server undeafen via API"));
    return { content: [{ type: "text", text: `${deafen ? 'Deafened' : 'Undeafened'} user ${userId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}


