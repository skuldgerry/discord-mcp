import { z } from "zod";
import { PermissionsBitField, PermissionResolvable } from "discord.js";
import { ToolContext, ToolResponse } from "./types.js";
import { 
  AddRoleSchema,
  RemoveRoleSchema,
  CreateRoleSchema,
  EditRoleSchema,
  DeleteRoleSchema,
  ListRolesSchema
} from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";

function parsePermissions(perms?: string[]): PermissionResolvable | undefined {
  if (!perms || perms.length === 0) return undefined;
  // Map string names to PermissionFlagsBits if possible; discord.js accepts strings as well
  return perms as unknown as PermissionResolvable;
}

export async function addRoleToMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, roleId, reason } = AddRoleSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const member = await guild.members.fetch(userId);
    const role = await guild.roles.fetch(roleId);
    if (!member || !role) {
      return { content: [{ type: "text", text: `Member or role not found` }], isError: true };
    }
    await member.roles.add(roleId, reason || "Role added via API");
    return { content: [{ type: "text", text: `Added role ${roleId} to user ${userId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function removeRoleFromMemberHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, userId, roleId, reason } = RemoveRoleSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const member = await guild.members.fetch(userId);
    const role = await guild.roles.fetch(roleId);
    if (!member || !role) {
      return { content: [{ type: "text", text: `Member or role not found` }], isError: true };
    }
    await member.roles.remove(roleId, reason || "Role removed via API");
    return { content: [{ type: "text", text: `Removed role ${roleId} from user ${userId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function createRoleHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, name, color, hoist, mentionable, permissions, reason } = CreateRoleSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const role = await guild.roles.create({
      name,
      color: color as any,
      hoist,
      mentionable,
      permissions: parsePermissions(permissions),
      reason
    });
    return { content: [{ type: "text", text: `Created role ${role.id} (${role.name})` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function editRoleHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, roleId, name, color, hoist, mentionable, permissions, reason } = EditRoleSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const role = await guild.roles.fetch(roleId);
    if (!role) {
      return { content: [{ type: "text", text: `Cannot find role ${roleId}` }], isError: true };
    }
    await role.edit({
      name,
      color: color as any,
      hoist,
      mentionable,
      permissions: parsePermissions(permissions),
      reason
    });
    return { content: [{ type: "text", text: `Edited role ${roleId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function deleteRoleHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, roleId, reason } = DeleteRoleSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const role = await guild.roles.fetch(roleId);
    if (!role) {
      return { content: [{ type: "text", text: `Cannot find role ${roleId}` }], isError: true };
    }
    await role.delete(reason || "Role deleted via API");
    return { content: [{ type: "text", text: `Deleted role ${roleId}` }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function listRolesHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId } = ListRolesSchema.parse(args);
  try {
    if (!context.client.isReady()) {
      return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
    }
    const guild = await context.client.guilds.fetch(guildId);
    if (!guild) {
      return { content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }], isError: true };
    }
    const roles = await guild.roles.fetch();
    const data = roles.map(r => ({ id: r.id, name: r.name, position: r.position, color: r.hexColor, hoist: r.hoist, mentionable: r.mentionable }));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return handleDiscordError(error);
  }
}


