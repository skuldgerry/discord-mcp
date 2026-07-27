import {
  type ColorResolvable,
  type PermissionResolvable,
  type RoleColorsEditResolvable,
  type RoleColorsResolvable
} from "discord.js";
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

function asColor(value: string | number): ColorResolvable {
  return value as ColorResolvable;
}

function createRoleColors(
  colors?: { primaryColor: string | number; secondaryColor?: string | number | null; tertiaryColor?: string | number | null },
  legacyColor?: string
): RoleColorsResolvable | undefined {
  if (!colors) return legacyColor ? { primaryColor: asColor(legacyColor) } : undefined;
  return {
    primaryColor: asColor(colors.primaryColor),
    ...(colors.secondaryColor != null ? { secondaryColor: asColor(colors.secondaryColor) } : {}),
    ...(colors.tertiaryColor != null ? { tertiaryColor: asColor(colors.tertiaryColor) } : {})
  };
}

function editRoleColors(
  colors?: { primaryColor: string | number; secondaryColor?: string | number | null; tertiaryColor?: string | number | null },
  legacyColor?: string
): RoleColorsEditResolvable | undefined {
  if (!colors) return legacyColor ? { primaryColor: asColor(legacyColor) } : undefined;
  return {
    primaryColor: asColor(colors.primaryColor),
    ...(colors.secondaryColor !== undefined
      ? { secondaryColor: colors.secondaryColor === null ? null : asColor(colors.secondaryColor) }
      : {}),
    ...(colors.tertiaryColor !== undefined
      ? { tertiaryColor: colors.tertiaryColor === null ? null : asColor(colors.tertiaryColor) }
      : {})
  };
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
  const { guildId, name, color, colors, hoist, mentionable, permissions, reason } = CreateRoleSchema.parse(args);
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
      ...(createRoleColors(colors, color) ? { colors: createRoleColors(colors, color)! } : {}),
      hoist,
      mentionable,
      permissions: parsePermissions(permissions),
      reason
    });
    const data = {
      guildId,
      roleId: role.id,
      name: role.name,
      colors: role.colors
    };
    return {
      content: [{ type: "text", text: `Created role ${role.id} (${role.name})` }],
      structuredContent: data
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}

export async function editRoleHandler(args: unknown, context: ToolContext): Promise<ToolResponse> {
  const { guildId, roleId, name, color, colors, hoist, mentionable, permissions, reason } = EditRoleSchema.parse(args);
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
    const edited = await role.edit({
      name,
      ...(editRoleColors(colors, color) ? { colors: editRoleColors(colors, color)! } : {}),
      hoist,
      mentionable,
      permissions: parsePermissions(permissions),
      reason
    });
    return {
      content: [{ type: "text", text: `Edited role ${roleId}` }],
      structuredContent: {
        guildId,
        roleId: edited.id,
        name: edited.name,
        colors: edited.colors
      }
    };
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
    const data = roles.map(r => ({
      id: r.id,
      name: r.name,
      position: r.position,
      color: r.hexColor,
      colors: r.colors,
      hoist: r.hoist,
      mentionable: r.mentionable
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { guildId, roles: data }
    };
  } catch (error) {
    return handleDiscordError(error);
  }
}


