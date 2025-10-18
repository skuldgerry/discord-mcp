import { ToolContext, ToolResponse } from "./types.js";
import { GetAuditLogsSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";

export async function getAuditLogsHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, limit, actionType, userId } = GetAuditLogsSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const logs = await guild.fetchAuditLogs({ limit: limit || 50, type: actionType as any, user: userId });
    const entries = logs.entries.map(e => ({
      id: e.id,
      action: e.actionType,
      targetId: (e.target as any)?.id || null,
      userId: e.executor?.id || null,
      reason: e.reason || null,
      createdAt: e.createdAt
    }));
    return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}


