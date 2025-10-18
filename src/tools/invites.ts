import { ToolContext, ToolResponse } from "./types.js";
import { CreateInviteSchema, GetInvitesSchema, GetChannelInvitesSchema, GetVanityUrlSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";

export async function createInviteHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { channelId, maxAgeSeconds, maxUses, temporary, reason } = CreateInviteSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !('invites' in channel)) return { content: [{ type: "text", text: `Channel does not support invites: ${channelId}` }], isError: true };
    const invite = await (channel as any).invites.create({ maxAge: maxAgeSeconds, maxUses, temporary, reason });
    return { content: [{ type: "text", text: JSON.stringify({ code: invite.code, url: invite.url }, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function getInvitesHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId } = GetInvitesSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const invites = await guild.invites.fetch();
    const data = invites.map(i => ({ code: i.code, channelId: i.channel?.id || null, uses: i.uses, maxUses: i.maxUses, temporary: i.temporary, createdAt: i.createdAt }));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function getChannelInvitesHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { channelId } = GetChannelInvitesSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const channel = await context.client.channels.fetch(channelId);
    if (!channel || !('invites' in channel)) return { content: [{ type: "text", text: `Channel does not support invites: ${channelId}` }], isError: true };
    const invites = await (channel as any).invites.fetch();
    const data = invites.map((i: any) => ({ code: i.code, uses: i.uses, maxUses: i.maxUses }));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function getVanityUrlHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId } = GetVanityUrlSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    if (!('fetchVanityData' in guild)) return { content: [{ type: "text", text: `Guild does not have vanity URL feature` }], isError: true };
    const vanity = await (guild as any).fetchVanityData();
    return { content: [{ type: "text", text: JSON.stringify({ code: vanity.code, uses: vanity.uses }, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}


