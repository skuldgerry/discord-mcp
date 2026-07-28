import { ChannelType, PermissionsBitField, VideoQualityMode } from "discord.js";
import { CreateTextChannelSchema, CreateVoiceChannelSchema, DeleteChannelSchema, ReadMessagesSchema, GetServerInfoSchema, CreateCategorySchema, EditCategorySchema, EditChannelSchema, GetChannelInfoSchema, CreateThreadSchema, EditThreadSchema, SetChannelPermissionOverwritesSchema, CutoverCategoriesSchema, DeleteCategorySchema, ListServersSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { SetSlowmodeSchema, LockChannelSchema, UnlockChannelSchema } from "../schemas.js";
function toPermissionOverwrites(overwrites) {
    return overwrites.map(overwrite => {
        // Resolve eagerly so invalid Discord permission names fail before any API mutation.
        const allow = new PermissionsBitField((overwrite.allow ?? []));
        const deny = new PermissionsBitField((overwrite.deny ?? []));
        return {
            id: overwrite.id,
            type: overwrite.type === "role" ? 0 : 1,
            allow,
            deny
        };
    });
}
function resolveParentId(input) {
    return input.parentId !== undefined ? input.parentId : input.categoryId;
}
function structured(summary, data) {
    return {
        content: [{ type: "text", text: `${summary}\n${JSON.stringify(data, null, 2)}` }],
        structuredContent: data
    };
}
export function serializePermissionOverwrites(channel) {
    const cache = channel?.permissionOverwrites?.cache;
    if (!cache || typeof cache.values !== "function")
        return [];
    return Array.from(cache.values())
        .map(overwrite => ({
        id: String(overwrite.id),
        type: overwrite.type === 0 || overwrite.type === "role" ? "role" : "member",
        allow: [...overwrite.allow.toArray()].sort(),
        deny: [...overwrite.deny.toArray()].sort()
    }))
        .sort((left, right) => `${left.type}:${left.id}`.localeCompare(`${right.type}:${right.id}`));
}
async function getPermissionsSynced(channel, context) {
    const parentId = "parentId" in channel ? channel.parentId : null;
    if (!parentId || !channel.permissionOverwrites?.cache)
        return null;
    try {
        const parent = await context.client.channels.fetch(parentId);
        if (!parent || !parent.permissionOverwrites?.cache)
            return null;
        return JSON.stringify(serializePermissionOverwrites(channel)) ===
            JSON.stringify(serializePermissionOverwrites(parent));
    }
    catch {
        // Permission sync verification is best-effort and must not turn a
        // successful edit into a failed tool call.
        return null;
    }
}
function serializeThread(thread) {
    return {
        guildId: thread.guildId ?? thread.guild?.id ?? null,
        channelId: thread.id,
        threadId: thread.id,
        parentChannelId: thread.parentId ?? null,
        name: thread.name,
        type: ChannelType[thread.type] ?? String(thread.type),
        ownerId: thread.ownerId ?? null,
        archived: thread.archived ?? false,
        locked: thread.locked ?? false,
        invitable: thread.invitable ?? null,
        autoArchiveDuration: thread.autoArchiveDuration ?? null,
        rateLimitPerUserSeconds: thread.rateLimitPerUser ?? null,
        messageCount: thread.messageCount ?? null,
        memberCount: thread.memberCount ?? null,
        createdAt: thread.createdAt?.toISOString?.() ?? null,
        archiveTimestamp: thread.archiveTimestamp?.toISOString?.() ?? null,
        url: thread.url ?? null
    };
}
// Category creation handler
export async function createCategoryHandler(args, context) {
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
        const options = { name, type: ChannelType.GuildCategory };
        if (typeof position === "number")
            options.position = position;
        if (permissionOverwrites !== undefined) {
            options.permissionOverwrites = toPermissionOverwrites(permissionOverwrites);
        }
        if (reason)
            options.reason = reason;
        const category = await guild.channels.create(options);
        return structured(`Successfully created category "${name}".`, {
            guildId: guild.id,
            categoryId: category.id,
            channelId: category.id,
            position: category.position
        });
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Category edit handler
export async function editCategoryHandler(args, context) {
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
        const update = {};
        if (name !== undefined)
            update.name = name;
        if (typeof position === "number")
            update.position = position;
        if (permissionOverwrites !== undefined) {
            update.permissionOverwrites = toPermissionOverwrites(permissionOverwrites);
        }
        if (reason)
            update.reason = reason;
        const edited = await category.edit(update);
        return structured("Successfully edited category.", {
            guildId: edited.guild.id,
            categoryId: edited.id,
            channelId: edited.id,
            position: edited.position
        });
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Category deletion handler
export async function deleteCategoryHandler(args, context) {
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
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Text channel creation handler
export async function createTextChannelHandler(args, context) {
    const parsed = CreateTextChannelSchema.parse(args);
    const { guildId, channelName, topic, position, permissionOverwrites, reason } = parsed;
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
        const channelOptions = {
            name: channelName,
            type: ChannelType.GuildText
        };
        if (topic)
            channelOptions.topic = topic;
        const parentId = resolveParentId(parsed);
        if (parentId !== undefined)
            channelOptions.parent = parentId;
        if (position !== undefined)
            channelOptions.position = position;
        if (permissionOverwrites !== undefined) {
            channelOptions.permissionOverwrites = toPermissionOverwrites(permissionOverwrites);
        }
        if (reason)
            channelOptions.reason = reason;
        const channel = await guild.channels.create(channelOptions);
        return structured(`Successfully created text channel "${channelName}".`, {
            guildId: guild.id,
            channelId: channel.id,
            parentId: channel.parentId,
            categoryId: channel.parentId,
            position: channel.position
        });
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
export async function createVoiceChannelHandler(args, context) {
    const parsed = CreateVoiceChannelSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const guild = await context.client.guilds.fetch(parsed.guildId);
        if (!guild) {
            return {
                content: [{
                        type: "text",
                        text: `Cannot find guild with ID: ${parsed.guildId}`
                    }],
                isError: true
            };
        }
        const parentId = resolveParentId(parsed);
        const options = {
            name: parsed.channelName,
            type: ChannelType.GuildVoice
        };
        if (parentId !== undefined)
            options.parent = parentId;
        if (parsed.position !== undefined)
            options.position = parsed.position;
        if (parsed.bitrate !== undefined)
            options.bitrate = parsed.bitrate;
        if (parsed.userLimit !== undefined)
            options.userLimit = parsed.userLimit;
        if (parsed.rtcRegion !== undefined)
            options.rtcRegion = parsed.rtcRegion;
        if (parsed.videoQualityMode !== undefined) {
            options.videoQualityMode = parsed.videoQualityMode === "full"
                ? VideoQualityMode.Full
                : VideoQualityMode.Auto;
        }
        if (parsed.permissionOverwrites !== undefined) {
            options.permissionOverwrites = toPermissionOverwrites(parsed.permissionOverwrites);
        }
        if (parsed.reason)
            options.reason = parsed.reason;
        const channel = await guild.channels.create(options);
        return structured(`Successfully created voice channel "${parsed.channelName}".`, {
            guildId: guild.id,
            channelId: channel.id,
            parentId: channel.parentId,
            categoryId: channel.parentId,
            position: channel.position,
            bitrate: "bitrate" in channel ? channel.bitrate : null,
            userLimit: "userLimit" in channel ? channel.userLimit : null,
            rtcRegion: "rtcRegion" in channel ? channel.rtcRegion : null,
            videoQualityMode: "videoQualityMode" in channel
                ? channel.videoQualityMode
                : null
        });
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
export async function editChannelHandler(args, context) {
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
        const parentSpecified = parsed.parentId !== undefined || parsed.categoryId !== undefined;
        const parentId = resolveParentId(parsed);
        let edited = channel;
        let lockPermissionsApplied = null;
        if (parentSpecified && parsed.lockPermissions !== undefined) {
            if (!("setParent" in channel) || typeof channel.setParent !== "function") {
                return {
                    content: [{
                            type: "text",
                            text: `Channel cannot be moved with native permission locking: ${parsed.channelId}`
                        }],
                    isError: true
                };
            }
            edited = await channel.setParent(parentId ?? null, {
                lockPermissions: parsed.lockPermissions,
                ...(parsed.reason ? { reason: parsed.reason } : {})
            });
            lockPermissionsApplied = parsed.lockPermissions;
        }
        const update = {};
        if (parsed.name !== undefined)
            update.name = parsed.name;
        if (parsed.topic !== undefined)
            update.topic = parsed.topic;
        if (parentSpecified && parsed.lockPermissions === undefined) {
            update.parent = parentId;
        }
        if (parsed.position !== undefined)
            update.position = parsed.position;
        if (parsed.nsfw !== undefined)
            update.nsfw = parsed.nsfw;
        if (parsed.rateLimitPerUserSeconds !== undefined) {
            update.rateLimitPerUser = parsed.rateLimitPerUserSeconds;
        }
        if (parsed.bitrate !== undefined)
            update.bitrate = parsed.bitrate;
        if (parsed.userLimit !== undefined)
            update.userLimit = parsed.userLimit;
        if (parsed.rtcRegion !== undefined)
            update.rtcRegion = parsed.rtcRegion;
        if (parsed.videoQualityMode !== undefined) {
            update.videoQualityMode = parsed.videoQualityMode === "full"
                ? VideoQualityMode.Full
                : VideoQualityMode.Auto;
        }
        if (parsed.defaultAutoArchiveDuration !== undefined) {
            update.defaultAutoArchiveDuration = parsed.defaultAutoArchiveDuration;
        }
        if (parsed.permissionOverwrites !== undefined) {
            update.permissionOverwrites = toPermissionOverwrites(parsed.permissionOverwrites);
        }
        if (Object.keys(update).length > 0) {
            if (parsed.reason)
                update.reason = parsed.reason;
            edited = await edited.edit(update);
        }
        const permissionsSynced = await getPermissionsSynced(edited, context);
        return structured("Successfully edited channel.", {
            guildId: edited.guild.id,
            channelId: edited.id,
            parentId: "parentId" in edited ? edited.parentId : null,
            categoryId: "parentId" in edited ? edited.parentId : null,
            position: "position" in edited ? edited.position : null,
            lockPermissionsRequested: parsed.lockPermissions ?? null,
            lockPermissionsApplied,
            permissionsSynced,
            nsfw: "nsfw" in edited ? edited.nsfw : null,
            rateLimitPerUserSeconds: "rateLimitPerUser" in edited
                ? edited.rateLimitPerUser
                : null,
            bitrate: "bitrate" in edited ? edited.bitrate : null,
            userLimit: "userLimit" in edited ? edited.userLimit : null,
            rtcRegion: "rtcRegion" in edited ? edited.rtcRegion : null,
            videoQualityMode: "videoQualityMode" in edited
                ? edited.videoQualityMode
                : null,
            defaultAutoArchiveDuration: "defaultAutoArchiveDuration" in edited
                ? edited.defaultAutoArchiveDuration
                : null
        });
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
export async function getChannelInfoHandler(args, context) {
    const { channelId } = GetChannelInfoSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const channel = await context.client.channels.fetch(channelId);
        if (!channel ||
            !("guild" in channel) ||
            !("name" in channel) ||
            !("permissionOverwrites" in channel) ||
            (typeof channel.isThread === "function" && channel.isThread())) {
            return {
                content: [{
                        type: "text",
                        text: `Cannot find supported non-thread guild channel with ID: ${channelId}`
                    }],
                isError: true
            };
        }
        const parentId = "parentId" in channel ? channel.parentId : null;
        const data = {
            guildId: channel.guild.id,
            channelId: channel.id,
            name: channel.name,
            type: ChannelType[channel.type] ?? String(channel.type),
            parentId,
            categoryId: parentId,
            position: "position" in channel ? channel.position : null,
            topic: "topic" in channel ? channel.topic : null,
            nsfw: "nsfw" in channel ? channel.nsfw : null,
            rateLimitPerUserSeconds: "rateLimitPerUser" in channel
                ? channel.rateLimitPerUser
                : null,
            bitrate: "bitrate" in channel ? channel.bitrate : null,
            userLimit: "userLimit" in channel ? channel.userLimit : null,
            rtcRegion: "rtcRegion" in channel ? channel.rtcRegion : null,
            videoQualityMode: "videoQualityMode" in channel
                ? channel.videoQualityMode
                : null,
            defaultAutoArchiveDuration: "defaultAutoArchiveDuration" in channel
                ? channel.defaultAutoArchiveDuration
                : null,
            permissionOverwrites: serializePermissionOverwrites(channel),
            permissionsSynced: await getPermissionsSynced(channel, context)
        };
        return structured("Discord channel information.", data);
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
export async function createThreadHandler(args, context) {
    const parsed = CreateThreadSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const parent = await context.client.channels.fetch(parsed.channelId);
        if (!parent ||
            (parent.type !== ChannelType.GuildText &&
                parent.type !== ChannelType.GuildAnnouncement) ||
            !("threads" in parent)) {
            return {
                content: [{
                        type: "text",
                        text: `Cannot create a text thread in channel ID: ${parsed.channelId}`
                    }],
                isError: true
            };
        }
        if (parsed.type === "private" && parent.type !== ChannelType.GuildText) {
            throw new Error("Private threads can only be created in guild text channels.");
        }
        const options = { name: parsed.name };
        if (parsed.startMessageId !== undefined) {
            options.startMessage = parsed.startMessageId;
        }
        if (parsed.type === "private") {
            options.type = ChannelType.PrivateThread;
        }
        else if (parsed.type === "public") {
            options.type = parent.type === ChannelType.GuildAnnouncement
                ? ChannelType.AnnouncementThread
                : ChannelType.PublicThread;
        }
        if (parsed.autoArchiveDuration !== undefined) {
            options.autoArchiveDuration = parsed.autoArchiveDuration;
        }
        if (parsed.rateLimitPerUserSeconds !== undefined) {
            options.rateLimitPerUser = parsed.rateLimitPerUserSeconds;
        }
        if (parsed.invitable !== undefined)
            options.invitable = parsed.invitable;
        if (parsed.reason)
            options.reason = parsed.reason;
        const thread = await parent.threads.create(options);
        return structured("Thread created successfully.", serializeThread(thread));
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
export async function editThreadHandler(args, context) {
    const parsed = EditThreadSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const thread = await context.client.channels.fetch(parsed.threadId);
        if (!thread || !thread.isThread()) {
            return {
                content: [{
                        type: "text",
                        text: `Cannot find thread with ID: ${parsed.threadId}`
                    }],
                isError: true
            };
        }
        if (parsed.invitable !== undefined &&
            thread.type !== ChannelType.PrivateThread) {
            throw new Error("invitable can only be changed on private threads.");
        }
        const update = {};
        if (parsed.name !== undefined)
            update.name = parsed.name;
        if (parsed.archived !== undefined)
            update.archived = parsed.archived;
        if (parsed.locked !== undefined)
            update.locked = parsed.locked;
        if (parsed.autoArchiveDuration !== undefined) {
            update.autoArchiveDuration = parsed.autoArchiveDuration;
        }
        if (parsed.rateLimitPerUserSeconds !== undefined) {
            update.rateLimitPerUser = parsed.rateLimitPerUserSeconds;
        }
        if (parsed.invitable !== undefined)
            update.invitable = parsed.invitable;
        if (parsed.reason)
            update.reason = parsed.reason;
        const edited = await thread.edit(update);
        return structured("Thread edited successfully.", serializeThread(edited));
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
export async function setChannelPermissionOverwritesHandler(args, context) {
    const { channelId, permissionOverwrites, reason } = SetChannelPermissionOverwritesSchema.parse(args);
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
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
export async function cutoverCategoriesHandler(args, context) {
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
        const oldEveryoneOverwrite = parsed.oldPermissionOverwrites.find(overwrite => overwrite.type === "role" && overwrite.id === oldCategory.guild.id);
        if (!oldEveryoneOverwrite?.deny?.includes("ViewChannel")) {
            throw new Error("oldPermissionOverwrites must deny ViewChannel to the guild @everyone role");
        }
        // Safety order: hide/archive the old category first. If a later request fails,
        // the migration remains private rather than exposing the new WIP category.
        await oldCategory.permissionOverwrites.set(toPermissionOverwrites(parsed.oldPermissionOverwrites), parsed.reason);
        await oldCategory.guild.channels.setPositions([
            { channel: oldCategory.id, position: parsed.oldPosition },
            { channel: newCategory.id, position: parsed.newPosition }
        ]);
        await newCategory.permissionOverwrites.set(toPermissionOverwrites(parsed.newPermissionOverwrites), parsed.reason);
        return structured("Category cutover completed in privacy-safe order.", {
            guildId: oldCategory.guild.id,
            oldCategoryId: oldCategory.id,
            newCategoryId: newCategory.id,
            oldPosition: parsed.oldPosition,
            newPosition: parsed.newPosition,
            safetyOrder: ["hideOld", "reposition", "revealNew"]
        });
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Channel deletion handler
export async function deleteChannelHandler(args, context) {
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
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Message reading handler
export async function readMessagesHandler(args, context) {
    const { channelId, limit, before, after, around } = ReadMessagesSchema.parse(args);
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
        const messages = await channel.messages.fetch({
            limit,
            ...(before ? { before } : {}),
            ...(after ? { after } : {}),
            ...(around ? { around } : {})
        });
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
            cursor: {
                before: before ?? null,
                after: after ?? null,
                around: around ?? null
            },
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
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Server information handler
export async function getServerInfoHandler(args, context) {
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
            if (!channel)
                return null;
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
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// List servers handler
export async function listServersHandler(args, context) {
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
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Set channel slowmode
export async function setSlowmodeHandler(args, context) {
    const { channelId, rateLimitPerUserSeconds, reason } = SetSlowmodeSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
        }
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !('rateLimitPerUser' in channel) || !('edit' in channel)) {
            return { content: [{ type: "text", text: `Channel type does not support slowmode: ${channelId}` }], isError: true };
        }
        await channel.edit({ rateLimitPerUser: rateLimitPerUserSeconds, reason });
        return { content: [{ type: "text", text: `Set slowmode to ${rateLimitPerUserSeconds}s for ${channelId}` }] };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Lock channel (deny @everyone SEND_MESSAGES)
export async function lockChannelHandler(args, context) {
    const { channelId, reason } = LockChannelSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
        }
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !('permissionOverwrites' in channel)) {
            return { content: [{ type: "text", text: `Channel not found or cannot set overwrites: ${channelId}` }], isError: true };
        }
        const everyone = channel.guild.roles.everyone;
        await channel.permissionOverwrites.edit(everyone, { SendMessages: false }, { reason });
        return { content: [{ type: "text", text: `Locked channel ${channelId}` }] };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Unlock channel (allow @everyone SEND_MESSAGES)
export async function unlockChannelHandler(args, context) {
    const { channelId, reason } = UnlockChannelSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return { content: [{ type: "text", text: "Discord client not logged in." }], isError: true };
        }
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !('permissionOverwrites' in channel)) {
            return { content: [{ type: "text", text: `Channel not found or cannot set overwrites: ${channelId}` }], isError: true };
        }
        const everyone = channel.guild.roles.everyone;
        await channel.permissionOverwrites.edit(everyone, { SendMessages: null }, { reason });
        return { content: [{ type: "text", text: `Unlocked channel ${channelId}` }] };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
