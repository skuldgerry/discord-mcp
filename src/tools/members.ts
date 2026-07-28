import { ToolContext, ToolResponse } from "./types.js";
import { GetMemberInfoSchema, ListMembersSchema, DMMemberSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { buildMessageCreatePayload, textAndStructured } from "./send-message.js";

export async function getMemberInfoHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId } = GetMemberInfoSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    const data = {
      id: member.id,
      user: {
        id: member.user.id,
        username: member.user.username,
        tag: member.user.tag,
        bot: member.user.bot
      },
      nickname: member.nickname,
      joinedAt: member.joinedAt,
      roles: member.roles.cache.map(r => ({ id: r.id, name: r.name })),
      permissions: member.permissions.toArray(),
      voice: member.voice?.channelId ? { channelId: member.voice.channelId, muted: member.voice.serverMute, deafened: member.voice.serverDeaf } : null
    };
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function listMembersHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, limit, query } = ListMembersSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const fetched = await guild.members.fetch({ query: query || undefined, limit: limit || 100 });
    const members = fetched.map(m => ({ id: m.id, tag: m.user.tag, nickname: m.nickname, roles: m.roles.cache.map(r => r.name) }));
    return { content: [{ type: "text", text: JSON.stringify(members, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function dmMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const parsed = DMMemberSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const user = await context.client.users.fetch(parsed.userId);
    const channel = await user.createDM();
    const { payload, isComponentsV2 } = buildMessageCreatePayload(parsed);
    const sent = await channel.send(payload);
    return textAndStructured("Direct message sent successfully.", {
      userId: parsed.userId,
      channelId: sent.channelId,
      messageId: sent.id,
      url: sent.url,
      componentsV2: isComponentsV2,
      suppressedNotifications: parsed.suppressNotifications ?? false,
      replyToMessageId: parsed.replyToMessageId ?? null
    });
  } catch (error) {
    return handleDiscordError(error);
  }
}


