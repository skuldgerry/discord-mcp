import { z } from "zod";

export const DiscordLoginSchema = z.object({
    token: z.string().optional()
});

export const SendMessageSchema = z.object({
    channelId: z.string(),
    message: z.string()
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

export const CreateTextChannelSchema = z.object({
    guildId: z.string(),
    channelName: z.string(),
    topic: z.string().optional(),
    reason: z.string().optional()
});

// Category schemas
export const CreateCategorySchema = z.object({
    guildId: z.string(),
    name: z.string(),
    position: z.number().optional(),
    reason: z.string().optional()
});

export const EditCategorySchema = z.object({
    categoryId: z.string(),
    name: z.string().optional(),
    position: z.number().optional(),
    reason: z.string().optional()
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
    channelId: z.string(),
    limit: z.number().min(1).max(100).optional().default(50)
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
    userId: z.string(),
    message: z.string()
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