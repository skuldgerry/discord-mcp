import { ToolContext, ToolResponse } from "./types.js";
import { CreateEmojiSchema, DeleteEmojiSchema, ListEmojisSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";

export async function listEmojisHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId } = ListEmojisSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const emojis = await guild.emojis.fetch();
    const data = emojis.map(e => ({ id: e.id, name: e.name, animated: e.animated }));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function createEmojiHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, name, imageUrl, reason } = CreateEmojiSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const emoji = await guild.emojis.create({ name, attachment: imageUrl, reason });
    return { content: [{ type: "text", text: `Created emoji ${emoji.name} (${emoji.id})` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function deleteEmojiHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, emojiId, reason } = DeleteEmojiSchema.parse(args);
  try {
    if (!context.client.isReady()) return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    const guild = await context.client.guilds.fetch(guildId);
    const emoji = await guild.emojis.fetch(emojiId);
    await emoji.delete(reason || "Emoji deleted via API");
    return { content: [{ type: "text", text: `Deleted emoji ${emojiId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}


