import { z } from "zod";

export const DiscordLoginSchema = z.object({
    token: z.string().optional()
});

export const DiscordIdSchema = z.string().regex(/^\d{17,20}$/, "Expected a Discord snowflake ID");
const HttpUrlSchema = z.string().url().refine(
    value => value.startsWith("https://") || value.startsWith("http://"),
    "Expected an HTTP or HTTPS URL"
);

export const AllowedMentionsSchema = z.object({
    parse: z.array(z.enum(["roles", "users", "everyone"])).max(3).optional(),
    users: z.array(DiscordIdSchema).max(100).optional(),
    roles: z.array(DiscordIdSchema).max(100).optional(),
    repliedUser: z.boolean().optional()
}).strict();

const LinkButtonSchema = z.object({
    label: z.string().min(1).max(80),
    url: HttpUrlSchema,
    emoji: z.string().optional(),
    disabled: z.boolean().optional()
});

const ThumbnailSchema = z.object({
    type: z.literal("thumbnail"),
    url: HttpUrlSchema,
    description: z.string().max(1024).optional(),
    spoiler: z.boolean().optional()
});

const SectionAccessorySchema = z.discriminatedUnion("type", [
    ThumbnailSchema,
    LinkButtonSchema.extend({ type: z.literal("link_button") })
]);

const TextDisplaySchema = z.object({
    type: z.literal("text_display"),
    content: z.string().min(1).max(4000)
});

const MediaGallerySchema = z.object({
    type: z.literal("media_gallery"),
    items: z.array(z.object({
        url: HttpUrlSchema,
        description: z.string().max(1024).optional(),
        spoiler: z.boolean().optional()
    })).min(1).max(10)
});

const SeparatorSchema = z.object({
    type: z.literal("separator"),
    divider: z.boolean().optional(),
    spacing: z.enum(["small", "large"]).optional()
});

const SectionSchema = z.object({
    type: z.literal("section"),
    text: z.array(z.string().min(1).max(4000)).min(1).max(3),
    accessory: SectionAccessorySchema
});

const LinkButtonsSchema = z.object({
    type: z.literal("link_buttons"),
    buttons: z.array(LinkButtonSchema).min(1).max(5)
});

const ContainerChildSchema = z.discriminatedUnion("type", [
    TextDisplaySchema,
    MediaGallerySchema,
    SeparatorSchema,
    SectionSchema,
    LinkButtonsSchema
]);

const ContainerSchema = z.object({
    type: z.literal("container"),
    accentColor: z.number().int().min(0).max(0xFFFFFF).optional(),
    spoiler: z.boolean().optional(),
    components: z.array(ContainerChildSchema).min(1).max(40)
});

export const MessageComponentSchema = z.discriminatedUnion("type", [
    TextDisplaySchema,
    MediaGallerySchema,
    SeparatorSchema,
    SectionSchema,
    LinkButtonsSchema,
    ContainerSchema
]);

export const PermissionOverwriteSchema = z.object({
    id: DiscordIdSchema,
    type: z.enum(["role", "member"]),
    allow: z.array(z.string().min(1)).max(100).optional(),
    deny: z.array(z.string().min(1)).max(100).optional()
}).strict().superRefine((value, context) => {
    const allowed = new Set(value.allow ?? []);
    for (const permission of value.deny ?? []) {
        if (allowed.has(permission)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["deny"],
                message: `Permission ${permission} cannot be both allowed and denied`
            });
        }
    }
});

const PermissionOverwritesSchema = z.array(PermissionOverwriteSchema).max(100);

function validateParentAliases(
    value: { parentId?: string | null; categoryId?: string | null },
    context: z.RefinementCtx
): void {
    if (
        value.parentId !== undefined &&
        value.categoryId !== undefined &&
        value.parentId !== value.categoryId
    ) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["categoryId"],
            message: "parentId and categoryId must match when both are provided"
        });
    }
}

export const SendMessageSchema = z.object({
    channelId: DiscordIdSchema,
    message: z.string().min(1).max(2000).optional(),
    content: z.string().min(1).max(2000).optional(),
    components: z.array(MessageComponentSchema).min(1).max(40).optional(),
    allowedMentions: AllowedMentionsSchema.optional(),
    suppressNotifications: z.boolean().optional(),
    replyToMessageId: DiscordIdSchema.optional(),
    failIfNotExists: z.boolean().optional()
}).superRefine((value, context) => {
    const modes = [
        value.message !== undefined,
        value.content !== undefined,
        value.components !== undefined
    ].filter(Boolean).length;

    if (modes !== 1) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide exactly one of message, content, or components"
        });
    }
    if (value.failIfNotExists !== undefined && value.replyToMessageId === undefined) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["failIfNotExists"],
            message: "failIfNotExists requires replyToMessageId"
        });
    }
});

export const EditMessageSchema = z.object({
    channelId: DiscordIdSchema,
    messageId: DiscordIdSchema,
    message: z.string().min(1).max(2000).optional(),
    content: z.string().min(1).max(2000).optional(),
    components: z.array(MessageComponentSchema).min(1).max(40).optional(),
    allowedMentions: AllowedMentionsSchema.optional()
}).superRefine((value, context) => {
    const modes = [
        value.message !== undefined,
        value.content !== undefined,
        value.components !== undefined
    ].filter(Boolean).length;

    if (modes !== 1) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide exactly one of message, content, or components"
        });
    }
});

export const GetMessageSchema = z.object({
    channelId: DiscordIdSchema,
    messageId: DiscordIdSchema
});

export const GetBotPermissionsSchema = z.object({
    guildId: DiscordIdSchema,
    channelId: DiscordIdSchema.optional()
});

export const ForwardMessageSchema = z.object({
    sourceChannelId: DiscordIdSchema,
    messageId: DiscordIdSchema,
    targetChannelId: DiscordIdSchema
});

export const CrosspostMessageSchema = z.object({
    channelId: DiscordIdSchema,
    messageId: DiscordIdSchema
});

export const SendPollSchema = z.object({
    channelId: DiscordIdSchema,
    question: z.string().min(1).max(300),
    answers: z.array(z.object({
        text: z.string().min(1).max(55),
        emoji: z.string().optional()
    })).min(2).max(10),
    durationHours: z.number().int().min(1).max(768),
    allowMultiselect: z.boolean().optional(),
    allowedMentions: AllowedMentionsSchema.optional(),
    suppressNotifications: z.boolean().optional()
});

export const EndPollSchema = z.object({
    channelId: DiscordIdSchema,
    messageId: DiscordIdSchema
});

export const GetPollVotersSchema = z.object({
    channelId: DiscordIdSchema,
    messageId: DiscordIdSchema,
    answerId: z.number().int().positive(),
    limit: z.number().int().min(1).max(100).optional(),
    after: DiscordIdSchema.optional()
});

export const GetForumChannelsSchema = z.object({
    guildId: z.string()
});

export const CreateForumPostSchema = z.object({
    forumChannelId: z.string(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()).optional()
});

export const GetForumPostSchema = z.object({
    threadId: z.string()
});

export const ReplyToForumSchema = z.object({
    threadId: z.string(),
    message: z.string()
});

const ThreadAutoArchiveDurationSchema = z.union([
    z.literal(60),
    z.literal(1440),
    z.literal(4320),
    z.literal(10080)
]);

export const CreateThreadSchema = z.object({
    channelId: DiscordIdSchema,
    name: z.string().min(1).max(100),
    startMessageId: DiscordIdSchema.optional(),
    type: z.enum(["public", "private"]).optional(),
    autoArchiveDuration: ThreadAutoArchiveDurationSchema.optional(),
    rateLimitPerUserSeconds: z.number().int().min(0).max(21600).optional(),
    invitable: z.boolean().optional(),
    reason: z.string().optional()
}).superRefine((value, context) => {
    if (value.startMessageId !== undefined && value.type === "private") {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["type"],
            message: "A thread started from a message cannot be private"
        });
    }
    if (value.invitable !== undefined && value.type !== "private") {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["invitable"],
            message: "invitable is only valid for private threads"
        });
    }
});

export const EditThreadSchema = z.object({
    threadId: DiscordIdSchema,
    name: z.string().min(1).max(100).optional(),
    archived: z.boolean().optional(),
    locked: z.boolean().optional(),
    autoArchiveDuration: ThreadAutoArchiveDurationSchema.optional(),
    rateLimitPerUserSeconds: z.number().int().min(0).max(21600).optional(),
    invitable: z.boolean().optional(),
    reason: z.string().optional()
}).superRefine((value, context) => {
    if (
        value.name === undefined &&
        value.archived === undefined &&
        value.locked === undefined &&
        value.autoArchiveDuration === undefined &&
        value.rateLimitPerUserSeconds === undefined &&
        value.invitable === undefined
    ) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide at least one thread field to edit"
        });
    }
});

export const CreateTextChannelSchema = z.object({
    guildId: DiscordIdSchema,
    channelName: z.string().min(1).max(100),
    topic: z.string().max(1024).optional(),
    parentId: DiscordIdSchema.nullable().optional(),
    categoryId: DiscordIdSchema.nullable().optional(),
    position: z.number().int().min(0).optional(),
    permissionOverwrites: PermissionOverwritesSchema.optional(),
    reason: z.string().optional()
}).superRefine(validateParentAliases);

export const CreateVoiceChannelSchema = z.object({
    guildId: DiscordIdSchema,
    channelName: z.string().min(1).max(100),
    parentId: DiscordIdSchema.nullable().optional(),
    categoryId: DiscordIdSchema.nullable().optional(),
    position: z.number().int().min(0).optional(),
    bitrate: z.number().int().min(8000).max(384000).optional(),
    userLimit: z.number().int().min(0).max(99).optional(),
    rtcRegion: z.string().min(1).nullable().optional(),
    videoQualityMode: z.enum(["auto", "full"]).optional(),
    permissionOverwrites: PermissionOverwritesSchema.optional(),
    reason: z.string().optional()
}).superRefine(validateParentAliases);

// Category schemas
export const CreateCategorySchema = z.object({
    guildId: DiscordIdSchema,
    name: z.string().min(1).max(100),
    position: z.number().int().min(0).optional(),
    permissionOverwrites: PermissionOverwritesSchema.optional(),
    reason: z.string().optional()
});

export const EditCategorySchema = z.object({
    categoryId: DiscordIdSchema,
    name: z.string().min(1).max(100).optional(),
    position: z.number().int().min(0).optional(),
    permissionOverwrites: PermissionOverwritesSchema.optional(),
    reason: z.string().optional()
});

export const EditChannelSchema = z.object({
    channelId: DiscordIdSchema,
    name: z.string().min(1).max(100).optional(),
    topic: z.string().max(1024).nullable().optional(),
    parentId: DiscordIdSchema.nullable().optional(),
    categoryId: DiscordIdSchema.nullable().optional(),
    lockPermissions: z.boolean().optional(),
    position: z.number().int().min(0).optional(),
    nsfw: z.boolean().optional(),
    rateLimitPerUserSeconds: z.number().int().min(0).max(21600).optional(),
    bitrate: z.number().int().min(8000).max(384000).optional(),
    userLimit: z.number().int().min(0).max(99).optional(),
    rtcRegion: z.string().min(1).nullable().optional(),
    videoQualityMode: z.enum(["auto", "full"]).optional(),
    defaultAutoArchiveDuration: ThreadAutoArchiveDurationSchema.optional(),
    permissionOverwrites: PermissionOverwritesSchema.optional(),
    reason: z.string().optional()
}).superRefine((value, context) => {
    validateParentAliases(value, context);
    const parentSpecified =
        value.parentId !== undefined || value.categoryId !== undefined;
    if (value.lockPermissions !== undefined && !parentSpecified) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lockPermissions"],
            message: "lockPermissions requires parentId or categoryId"
        });
    }
    if (value.lockPermissions === true && value.permissionOverwrites !== undefined) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["permissionOverwrites"],
            message: "permissionOverwrites cannot be combined with lockPermissions=true"
        });
    }
    if (
        value.name === undefined &&
        value.topic === undefined &&
        value.parentId === undefined &&
        value.categoryId === undefined &&
        value.position === undefined &&
        value.nsfw === undefined &&
        value.rateLimitPerUserSeconds === undefined &&
        value.bitrate === undefined &&
        value.userLimit === undefined &&
        value.rtcRegion === undefined &&
        value.videoQualityMode === undefined &&
        value.defaultAutoArchiveDuration === undefined &&
        value.permissionOverwrites === undefined
    ) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide at least one channel field to edit"
        });
    }
});

export const GetChannelInfoSchema = z.object({
    channelId: DiscordIdSchema
});

export const SetChannelPermissionOverwritesSchema = z.object({
    channelId: DiscordIdSchema,
    permissionOverwrites: PermissionOverwritesSchema,
    reason: z.string().optional()
});

export const CutoverCategoriesSchema = z.object({
    oldCategoryId: DiscordIdSchema,
    newCategoryId: DiscordIdSchema,
    oldPosition: z.number().int().min(0),
    newPosition: z.number().int().min(0),
    oldPermissionOverwrites: PermissionOverwritesSchema,
    newPermissionOverwrites: PermissionOverwritesSchema,
    reason: z.string().optional()
}).refine(value => value.oldCategoryId !== value.newCategoryId, {
    path: ["newCategoryId"],
    message: "Old and new categories must be different"
});

export const DeleteCategorySchema = z.object({
    categoryId: z.string(),
    reason: z.string().optional()
});

export const DeleteChannelSchema = z.object({
    channelId: z.string(),
    reason: z.string().optional()
});

export const ReadMessagesSchema = z.object({
    channelId: DiscordIdSchema,
    limit: z.number().int().min(1).max(100).optional().default(50),
    before: DiscordIdSchema.optional(),
    after: DiscordIdSchema.optional(),
    around: DiscordIdSchema.optional()
}).superRefine((value, context) => {
    const cursorCount = [value.before, value.after, value.around]
        .filter(cursor => cursor !== undefined).length;
    if (cursorCount > 1) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide at most one of before, after, or around"
        });
    }
});

export const GetServerInfoSchema = z.object({
    guildId: z.string()
});

export const AddReactionSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    emoji: z.string()
});

export const AddMultipleReactionsSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    emojis: z.array(z.string())
});

export const RemoveReactionSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    emoji: z.string(),
    userId: z.string().optional()
});

export const DeleteForumPostSchema = z.object({
    threadId: z.string(),
    reason: z.string().optional()
});

export const DeleteMessageSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    reason: z.string().optional()
});

export const CreateWebhookSchema = z.object({
    channelId: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    reason: z.string().optional()
});

export const SendWebhookMessageSchema = z.object({
    webhookId: z.string(),
    webhookToken: z.string(),
    content: z.string(),
    username: z.string().optional(),
    avatarURL: z.string().optional(),
    threadId: z.string().optional()
});

export const EditWebhookSchema = z.object({
    webhookId: z.string(),
    webhookToken: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional(),
    channelId: z.string().optional(),
    reason: z.string().optional()
});

export const DeleteWebhookSchema = z.object({
    webhookId: z.string(),
    webhookToken: z.string().optional(),
    reason: z.string().optional()
});

export const ListServersSchema = z.object({});

// Moderation schemas
export const KickMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    reason: z.string().optional()
});

export const BanMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    deleteMessageDays: z.number().min(0).max(7).optional(),
    reason: z.string().optional()
});

export const UnbanMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    reason: z.string().optional()
});

export const TimeoutMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    durationMinutes: z.number().min(1).max(10080), // up to 7 days
    reason: z.string().optional()
});

export const DisconnectMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    reason: z.string().optional()
});

export const MoveMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    channelId: z.string(), // target voice channel
    reason: z.string().optional()
});

// Role management schemas
const RoleColorSchema = z.union([
    z.number().int().min(0).max(0xFFFFFF),
    z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a hex color such as #5865F2")
]);

const RoleColorsSchema = z.object({
    primaryColor: RoleColorSchema,
    secondaryColor: RoleColorSchema.nullable().optional(),
    tertiaryColor: RoleColorSchema.nullable().optional()
}).strict();

export const AddRoleSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    roleId: z.string(),
    reason: z.string().optional()
});

export const RemoveRoleSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    roleId: z.string(),
    reason: z.string().optional()
});

export const CreateRoleSchema = z.object({
    guildId: z.string(),
    name: z.string(),
    color: z.string().optional(),
    colors: RoleColorsSchema.optional(),
    hoist: z.boolean().optional(),
    mentionable: z.boolean().optional(),
    permissions: z.array(z.string()).optional(),
    reason: z.string().optional()
});

export const EditRoleSchema = z.object({
    guildId: z.string(),
    roleId: z.string(),
    name: z.string().optional(),
    color: z.string().optional(),
    colors: RoleColorsSchema.optional(),
    hoist: z.boolean().optional(),
    mentionable: z.boolean().optional(),
    permissions: z.array(z.string()).optional(),
    reason: z.string().optional()
});

export const DeleteRoleSchema = z.object({
    guildId: z.string(),
    roleId: z.string(),
    reason: z.string().optional()
});

// Additional moderation/member schemas
export const RemoveTimeoutSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    reason: z.string().optional()
});

export const BulkDeleteMessagesSchema = z.object({
    channelId: z.string(),
    count: z.number().min(1).max(100),
    filterUserId: z.string().optional(),
    filterContains: z.string().optional(),
    reason: z.string().optional()
});

export const SetNicknameSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    nickname: z.string().nullable(),
    reason: z.string().optional()
});

export const GetBansSchema = z.object({
    guildId: z.string()
});

// Voice schemas
export const VoiceMuteSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    mute: z.boolean(),
    reason: z.string().optional()
});

export const VoiceDeafenSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    deafen: z.boolean(),
    reason: z.string().optional()
});

// Member info/list
export const GetMemberInfoSchema = z.object({
    guildId: z.string(),
    userId: z.string()
});

export const ListMembersSchema = z.object({
    guildId: z.string(),
    limit: z.number().min(1).max(1000).optional(),
    query: z.string().optional()
});

// Invites
export const CreateInviteSchema = z.object({
    channelId: z.string(),
    maxAgeSeconds: z.number().min(0).optional(),
    maxUses: z.number().min(0).optional(),
    temporary: z.boolean().optional(),
    reason: z.string().optional()
});

export const GetInvitesSchema = z.object({
    guildId: z.string()
});

// Audit logs
export const GetAuditLogsSchema = z.object({
    guildId: z.string(),
    limit: z.number().min(1).max(100).optional(),
    actionType: z.number().optional(),
    userId: z.string().optional()
});

// Suggested additions
export const ListRolesSchema = z.object({
    guildId: z.string()
});

export const SoftbanMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    deleteMessageDays: z.number().min(0).max(7).optional(),
    reason: z.string().optional()
});

export const SetSlowmodeSchema = z.object({
    channelId: z.string(),
    rateLimitPerUserSeconds: z.number().min(0).max(21600),
    reason: z.string().optional()
});

export const LockChannelSchema = z.object({
    channelId: z.string(),
    reason: z.string().optional()
});

export const UnlockChannelSchema = z.object({
    channelId: z.string(),
    reason: z.string().optional()
});

export const PinMessageSchema = z.object({
    channelId: z.string(),
    messageId: z.string()
});

export const UnpinMessageSchema = z.object({
    channelId: z.string(),
    messageId: z.string()
});

export const DMMemberSchema = z.object({
    userId: DiscordIdSchema,
    message: z.string().min(1).max(2000).optional(),
    content: z.string().min(1).max(2000).optional(),
    components: z.array(MessageComponentSchema).min(1).max(40).optional(),
    allowedMentions: AllowedMentionsSchema.optional(),
    suppressNotifications: z.boolean().optional(),
    replyToMessageId: DiscordIdSchema.optional(),
    failIfNotExists: z.boolean().optional()
}).superRefine((value, context) => {
    const modes = [
        value.message !== undefined,
        value.content !== undefined,
        value.components !== undefined
    ].filter(Boolean).length;

    if (modes !== 1) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide exactly one of message, content, or components"
        });
    }
    if (value.failIfNotExists !== undefined && value.replyToMessageId === undefined) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["failIfNotExists"],
            message: "failIfNotExists requires replyToMessageId"
        });
    }
});

export const GetChannelInvitesSchema = z.object({
    channelId: z.string()
});

export const GetVanityUrlSchema = z.object({
    guildId: z.string()
});

export const CreateEmojiSchema = z.object({
    guildId: z.string(),
    name: z.string(),
    imageUrl: z.string(),
    reason: z.string().optional()
});

export const DeleteEmojiSchema = z.object({
    guildId: z.string(),
    emojiId: z.string(),
    reason: z.string().optional()
});

export const ListEmojisSchema = z.object({
    guildId: z.string()
});
