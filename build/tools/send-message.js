import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ThumbnailBuilder, } from "discord.js";
import { CrosspostMessageSchema, EditMessageSchema, EndPollSchema, ForwardMessageSchema, GetBotPermissionsSchema, GetMessageSchema, GetPollVotersSchema, SendMessageSchema, SendPollSchema, } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
export function textAndStructured(summary, data) {
    return {
        content: [{ type: "text", text: `${summary}\n${JSON.stringify(data, null, 2)}` }],
        structuredContent: data,
    };
}
function buildLinkButton(input) {
    const button = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(input.label)
        .setURL(input.url);
    if (input.emoji)
        button.setEmoji(input.emoji);
    if (input.disabled !== undefined)
        button.setDisabled(input.disabled);
    return button;
}
function buildSection(input) {
    const section = new SectionBuilder();
    section.addTextDisplayComponents(input.text.map(content => new TextDisplayBuilder().setContent(content)));
    if (input.accessory.type === "thumbnail") {
        const thumbnail = new ThumbnailBuilder().setURL(input.accessory.url);
        if (input.accessory.description)
            thumbnail.setDescription(input.accessory.description);
        if (input.accessory.spoiler !== undefined)
            thumbnail.setSpoiler(input.accessory.spoiler);
        section.setThumbnailAccessory(thumbnail);
    }
    else {
        section.setButtonAccessory(buildLinkButton(input.accessory));
    }
    return section;
}
function buildComponent(input) {
    switch (input.type) {
        case "text_display":
            return new TextDisplayBuilder().setContent(input.content);
        case "media_gallery": {
            const gallery = new MediaGalleryBuilder();
            gallery.addItems(input.items.map(item => {
                const media = new MediaGalleryItemBuilder().setURL(item.url);
                if (item.description)
                    media.setDescription(item.description);
                if (item.spoiler !== undefined)
                    media.setSpoiler(item.spoiler);
                return media;
            }));
            return gallery;
        }
        case "separator": {
            const separator = new SeparatorBuilder();
            if (input.divider !== undefined)
                separator.setDivider(input.divider);
            if (input.spacing) {
                separator.setSpacing(input.spacing === "large"
                    ? SeparatorSpacingSize.Large
                    : SeparatorSpacingSize.Small);
            }
            return separator;
        }
        case "section":
            return buildSection(input);
        case "link_buttons":
            return new ActionRowBuilder().addComponents(input.buttons.map(buildLinkButton));
        case "container": {
            const container = new ContainerBuilder();
            if (input.accentColor !== undefined)
                container.setAccentColor(input.accentColor);
            if (input.spoiler !== undefined)
                container.setSpoiler(input.spoiler);
            for (const child of input.components) {
                const built = buildComponent(child);
                if (built instanceof TextDisplayBuilder)
                    container.addTextDisplayComponents(built);
                else if (built instanceof MediaGalleryBuilder)
                    container.addMediaGalleryComponents(built);
                else if (built instanceof SeparatorBuilder)
                    container.addSeparatorComponents(built);
                else if (built instanceof SectionBuilder)
                    container.addSectionComponents(built);
                else if (built instanceof ActionRowBuilder)
                    container.addActionRowComponents(built);
            }
            return container;
        }
    }
}
function toAllowedMentions(input) {
    if (input === undefined)
        return undefined;
    return {
        ...(input.parse !== undefined ? { parse: input.parse } : {}),
        ...(input.users !== undefined ? { users: input.users } : {}),
        ...(input.roles !== undefined ? { roles: input.roles } : {}),
        ...(input.repliedUser !== undefined ? { repliedUser: input.repliedUser } : {}),
    };
}
export function buildMessageCreatePayload(args) {
    const isComponentsV2 = args.components !== undefined;
    const flags = [
        ...(isComponentsV2 ? ["IsComponentsV2"] : []),
        ...(args.suppressNotifications ? ["SuppressNotifications"] : []),
    ];
    const payload = {
        ...(isComponentsV2
            ? { components: args.components.map(buildComponent) }
            : { content: args.message ?? args.content }),
        ...(args.allowedMentions !== undefined
            ? { allowedMentions: toAllowedMentions(args.allowedMentions) }
            : {}),
        ...(args.replyToMessageId !== undefined
            ? {
                reply: {
                    messageReference: args.replyToMessageId,
                    failIfNotExists: args.failIfNotExists ?? true,
                },
            }
            : {}),
        ...(flags.length > 0 ? { flags } : {}),
    };
    return { payload, isComponentsV2 };
}
async function getMessageManager(client, channelId) {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !("messages" in channel)) {
        throw new Error(`Cannot find message-capable text channel ID: ${channelId}`);
    }
    return { channel, messages: channel.messages };
}
function serializeMessage(message) {
    return {
        channelId: message.channelId,
        messageId: message.id,
        guildId: message.guildId,
        author: {
            id: message.author.id,
            username: message.author.username,
            bot: message.author.bot,
        },
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        editedAt: message.editedAt?.toISOString() ?? null,
        flags: message.flags.toArray(),
        pinned: message.pinned,
        url: message.url,
        components: message.components.map(component => component.toJSON()),
        attachments: message.attachments.map(attachment => ({
            id: attachment.id,
            name: attachment.name,
            url: attachment.url,
            contentType: attachment.contentType,
            size: attachment.size,
        })),
        embeds: message.embeds.map(embed => embed.toJSON()),
        poll: message.poll ? {
            question: message.poll.question.text,
            expiresAt: message.poll.expiresAt?.toISOString() ?? null,
            allowMultiselect: message.poll.allowMultiselect,
            finalized: message.poll.resultsFinalized,
            answers: message.poll.answers.map(answer => ({
                id: answer.id,
                text: answer.text,
                emoji: answer.emoji?.identifier ?? null,
                votes: answer.voteCount,
            })),
        } : null,
    };
}
export const sendMessageHandler = async (rawArgs, { client }) => {
    const args = SendMessageSchema.parse(rawArgs);
    try {
        if (!client.isReady())
            throw new Error("Discord client not logged in.");
        const channel = await client.channels.fetch(args.channelId);
        if (!channel || !channel.isTextBased() || !("send" in channel)) {
            throw new Error(`Cannot find sendable text channel ID: ${args.channelId}`);
        }
        const { payload, isComponentsV2 } = buildMessageCreatePayload(args);
        const sent = await channel.send(payload);
        return textAndStructured("Message sent successfully.", {
            channelId: sent.channelId,
            messageId: sent.id,
            url: sent.url,
            componentsV2: isComponentsV2,
            suppressedNotifications: args.suppressNotifications ?? false,
            replyToMessageId: args.replyToMessageId ?? null,
        });
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const editMessageHandler = async (rawArgs, { client }) => {
    const args = EditMessageSchema.parse(rawArgs);
    try {
        if (!client.isReady() || !client.user)
            throw new Error("Discord client not logged in.");
        const { messages } = await getMessageManager(client, args.channelId);
        const existing = await messages.fetch(args.messageId);
        if (existing.author.id !== client.user.id) {
            throw new Error("The bot can only edit messages authored by itself.");
        }
        const isComponentsV2 = args.components !== undefined;
        if (existing.flags.has(MessageFlags.IsComponentsV2) && !isComponentsV2) {
            throw new Error("Discord does not allow removing the IsComponentsV2 flag. Edit this message with Components V2, using a text_display component for text.");
        }
        const payload = isComponentsV2
            ? {
                content: null,
                components: args.components.map(buildComponent),
                flags: MessageFlags.IsComponentsV2,
                ...(args.allowedMentions !== undefined
                    ? { allowedMentions: toAllowedMentions(args.allowedMentions) }
                    : {}),
            }
            : {
                content: args.message ?? args.content,
                components: [],
                ...(args.allowedMentions !== undefined
                    ? { allowedMentions: toAllowedMentions(args.allowedMentions) }
                    : {}),
            };
        const edited = await messages.edit(existing, payload);
        return textAndStructured("Message edited successfully.", {
            channelId: edited.channelId,
            messageId: edited.id,
            url: edited.url,
            componentsV2: isComponentsV2,
        });
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const getMessageHandler = async (rawArgs, { client }) => {
    const args = GetMessageSchema.parse(rawArgs);
    try {
        const { messages } = await getMessageManager(client, args.channelId);
        const message = await messages.fetch(args.messageId);
        const data = {
            ...serializeMessage(message),
            editableByBot: message.author.id === client.user?.id,
        };
        return textAndStructured("Message retrieved.", data);
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const getBotPermissionsHandler = async (rawArgs, { client }) => {
    const args = GetBotPermissionsSchema.parse(rawArgs);
    try {
        const guild = await client.guilds.fetch(args.guildId);
        const member = guild.members.me ?? await guild.members.fetchMe();
        let permissions = member.permissions;
        let channelType = null;
        if (args.channelId) {
            const channel = await guild.channels.fetch(args.channelId);
            if (!channel)
                throw new Error(`Cannot find channel ID: ${args.channelId}`);
            permissions = channel.permissionsFor(member);
            channelType = String(channel.type);
        }
        const permissionNames = permissions.toArray();
        const data = {
            guildId: guild.id,
            channelId: args.channelId ?? null,
            channelType,
            permissions: permissionNames,
            capabilities: {
                viewChannel: permissions.has("ViewChannel"),
                sendMessages: permissions.has("SendMessages"),
                embedLinks: permissions.has("EmbedLinks"),
                attachFiles: permissions.has("AttachFiles"),
                manageMessages: permissions.has("ManageMessages"),
                pinMessages: permissions.has("PinMessages"),
                createPolls: permissions.has("SendPolls"),
                createEvents: permissions.has("CreateEvents"),
                createGuildExpressions: permissions.has("CreateGuildExpressions"),
            },
        };
        return textAndStructured("Bot permissions retrieved.", data);
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const forwardMessageHandler = async (rawArgs, { client }) => {
    const args = ForwardMessageSchema.parse(rawArgs);
    try {
        const { messages } = await getMessageManager(client, args.sourceChannelId);
        const source = await messages.fetch(args.messageId);
        const forwarded = await source.forward(args.targetChannelId);
        return textAndStructured("Message forwarded successfully.", {
            sourceChannelId: args.sourceChannelId,
            sourceMessageId: args.messageId,
            channelId: forwarded.channelId,
            messageId: forwarded.id,
            url: forwarded.url,
        });
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const crosspostMessageHandler = async (rawArgs, { client }) => {
    const args = CrosspostMessageSchema.parse(rawArgs);
    try {
        const { channel, messages } = await getMessageManager(client, args.channelId);
        if (!("crosspost" in messages)) {
            throw new Error("This channel does not support crossposting.");
        }
        const message = await messages.fetch(args.messageId);
        const published = await messages.crosspost(message);
        return textAndStructured("Message crossposted successfully.", {
            channelId: channel.id,
            messageId: published.id,
            url: published.url,
        });
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const sendPollHandler = async (rawArgs, { client }) => {
    const args = SendPollSchema.parse(rawArgs);
    try {
        const channel = await client.channels.fetch(args.channelId);
        if (!channel || !channel.isTextBased() || !("send" in channel)) {
            throw new Error(`Cannot find sendable text channel ID: ${args.channelId}`);
        }
        const poll = await channel.send({
            poll: {
                question: { text: args.question },
                answers: args.answers,
                duration: args.durationHours,
                allowMultiselect: args.allowMultiselect ?? false,
            },
            ...(args.allowedMentions !== undefined
                ? { allowedMentions: toAllowedMentions(args.allowedMentions) }
                : {}),
            ...(args.suppressNotifications
                ? { flags: MessageFlags.SuppressNotifications }
                : {}),
        });
        return textAndStructured("Poll sent successfully.", {
            channelId: poll.channelId,
            messageId: poll.id,
            url: poll.url,
            expiresAt: poll.poll?.expiresAt?.toISOString() ?? null,
        });
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const endPollHandler = async (rawArgs, { client }) => {
    const args = EndPollSchema.parse(rawArgs);
    try {
        if (!client.user)
            throw new Error("Discord client not logged in.");
        const { messages } = await getMessageManager(client, args.channelId);
        const message = await messages.fetch(args.messageId);
        if (message.author.id !== client.user.id) {
            throw new Error("The bot can only end polls authored by itself.");
        }
        const ended = await messages.endPoll(message.id);
        return textAndStructured("Poll ended successfully.", {
            channelId: ended.channelId,
            messageId: ended.id,
            url: ended.url,
        });
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
export const getPollVotersHandler = async (rawArgs, { client }) => {
    const args = GetPollVotersSchema.parse(rawArgs);
    try {
        const { messages } = await getMessageManager(client, args.channelId);
        const voters = await messages.fetchPollAnswerVoters({
            messageId: args.messageId,
            answerId: args.answerId,
            ...(args.limit !== undefined ? { limit: args.limit } : {}),
            ...(args.after !== undefined ? { after: args.after } : {}),
        });
        const data = {
            channelId: args.channelId,
            messageId: args.messageId,
            answerId: args.answerId,
            voters: voters.map(user => ({
                id: user.id,
                username: user.username,
                globalName: user.globalName,
                bot: user.bot,
            })),
        };
        return textAndStructured("Poll voters retrieved.", data);
    }
    catch (caught) {
        return handleDiscordError(caught);
    }
};
