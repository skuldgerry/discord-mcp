import { loginHandler } from './login.js';
import { crosspostMessageHandler, editMessageHandler, endPollHandler, forwardMessageHandler, getBotPermissionsHandler, getMessageHandler, getPollVotersHandler, sendMessageHandler, sendPollHandler } from './send-message.js';
import { getForumChannelsHandler, createForumPostHandler, getForumPostHandler, replyToForumHandler, deleteForumPostHandler } from './forum.js';
import { createTextChannelHandler, createVoiceChannelHandler, createThreadHandler, editThreadHandler, editChannelHandler, getChannelInfoHandler, setChannelPermissionOverwritesHandler, cutoverCategoriesHandler, deleteChannelHandler, readMessagesHandler, getServerInfoHandler, createCategoryHandler, editCategoryHandler, deleteCategoryHandler, listServersHandler, setSlowmodeHandler, lockChannelHandler, unlockChannelHandler } from './channel.js';
import { addReactionHandler, addMultipleReactionsHandler, removeReactionHandler, deleteMessageHandler } from './reactions.js';
import { createWebhookHandler, sendWebhookMessageHandler, editWebhookHandler, deleteWebhookHandler } from './webhooks.js';
import { kickMemberHandler, banMemberHandler, unbanMemberHandler, timeoutMemberHandler, disconnectMemberHandler, moveMemberHandler, removeTimeoutHandler, bulkDeleteMessagesHandler, setNicknameHandler, getBansHandler, softbanMemberHandler, pinMessageHandler, unpinMessageHandler } from './moderation.js';
import { addRoleToMemberHandler, removeRoleFromMemberHandler, createRoleHandler, editRoleHandler, deleteRoleHandler } from './roles.js';
import { listRolesHandler } from './roles.js';
import { disconnectVoiceHandler, moveVoiceHandler, voiceMuteHandler, voiceDeafenHandler } from './voice.js';
import { getMemberInfoHandler, listMembersHandler, dmMemberHandler } from './members.js';
import { createInviteHandler, getInvitesHandler, getChannelInvitesHandler, getVanityUrlHandler } from './invites.js';
import { getAuditLogsHandler } from './audit.js';
import { listEmojisHandler, createEmojiHandler, deleteEmojiHandler } from './emojis.js';
export const toolHandlers = {
    discord_create_category: createCategoryHandler,
    discord_edit_category: editCategoryHandler,
    discord_delete_category: deleteCategoryHandler,
    discord_login: loginHandler,
    discord_send: sendMessageHandler,
    discord_edit_message: editMessageHandler,
    discord_get_message: getMessageHandler,
    discord_get_bot_permissions: getBotPermissionsHandler,
    discord_forward_message: forwardMessageHandler,
    discord_crosspost_message: crosspostMessageHandler,
    discord_send_poll: sendPollHandler,
    discord_end_poll: endPollHandler,
    discord_get_poll_voters: getPollVotersHandler,
    discord_get_forum_channels: getForumChannelsHandler,
    discord_create_forum_post: createForumPostHandler,
    discord_get_forum_post: getForumPostHandler,
    discord_reply_to_forum: replyToForumHandler,
    discord_delete_forum_post: deleteForumPostHandler,
    discord_create_text_channel: createTextChannelHandler,
    discord_create_voice_channel: createVoiceChannelHandler,
    discord_edit_channel: editChannelHandler,
    discord_get_channel_info: getChannelInfoHandler,
    discord_create_thread: createThreadHandler,
    discord_edit_thread: editThreadHandler,
    discord_set_channel_permission_overwrites: setChannelPermissionOverwritesHandler,
    discord_cutover_categories: cutoverCategoriesHandler,
    discord_delete_channel: deleteChannelHandler,
    discord_read_messages: readMessagesHandler,
    discord_get_server_info: getServerInfoHandler,
    discord_add_reaction: addReactionHandler,
    discord_add_multiple_reactions: addMultipleReactionsHandler,
    discord_remove_reaction: removeReactionHandler,
    discord_delete_message: deleteMessageHandler,
    discord_create_webhook: createWebhookHandler,
    discord_send_webhook_message: sendWebhookMessageHandler,
    discord_edit_webhook: editWebhookHandler,
    discord_delete_webhook: deleteWebhookHandler,
    discord_list_servers: listServersHandler,
    discord_kick_member: kickMemberHandler,
    discord_ban_member: banMemberHandler,
    discord_unban_member: unbanMemberHandler,
    discord_timeout_member: timeoutMemberHandler,
    discord_disconnect_member: disconnectMemberHandler,
    discord_move_member: moveMemberHandler,
    discord_add_role: addRoleToMemberHandler,
    discord_remove_role: removeRoleFromMemberHandler,
    discord_create_role: createRoleHandler,
    discord_edit_role: editRoleHandler,
    discord_delete_role: deleteRoleHandler,
    discord_disconnect_voice: disconnectVoiceHandler,
    discord_move_voice: moveVoiceHandler,
    discord_voice_mute: voiceMuteHandler,
    discord_voice_deafen: voiceDeafenHandler,
    discord_get_member_info: getMemberInfoHandler,
    discord_list_members: listMembersHandler,
    discord_create_invite: createInviteHandler,
    discord_get_invites: getInvitesHandler,
    discord_get_audit_logs: getAuditLogsHandler,
    discord_remove_timeout: removeTimeoutHandler,
    discord_bulk_delete: bulkDeleteMessagesHandler,
    discord_set_nickname: setNicknameHandler,
    discord_get_bans: getBansHandler,
    discord_softban_member: softbanMemberHandler,
    discord_pin_message: pinMessageHandler,
    discord_unpin_message: unpinMessageHandler,
    discord_set_slowmode: setSlowmodeHandler,
    discord_lock_channel: lockChannelHandler,
    discord_unlock_channel: unlockChannelHandler,
    discord_get_channel_invites: getChannelInvitesHandler,
    discord_get_vanity_url: getVanityUrlHandler,
    discord_dm_member: dmMemberHandler,
    discord_list_emojis: listEmojisHandler,
    discord_create_emoji: createEmojiHandler,
    discord_delete_emoji: deleteEmojiHandler,
    discord_list_roles: listRolesHandler,
};
export function getToolHandler(name) {
    return toolHandlers[name];
}
// Export tool handlers
export { loginHandler, sendMessageHandler, editMessageHandler, getMessageHandler, getBotPermissionsHandler, forwardMessageHandler, crosspostMessageHandler, sendPollHandler, endPollHandler, getPollVotersHandler, getForumChannelsHandler, createForumPostHandler, getForumPostHandler, replyToForumHandler, deleteForumPostHandler, createTextChannelHandler, createVoiceChannelHandler, editChannelHandler, getChannelInfoHandler, createThreadHandler, editThreadHandler, setChannelPermissionOverwritesHandler, cutoverCategoriesHandler, deleteChannelHandler, readMessagesHandler, getServerInfoHandler, addReactionHandler, addMultipleReactionsHandler, removeReactionHandler, deleteMessageHandler, createWebhookHandler, sendWebhookMessageHandler, editWebhookHandler, deleteWebhookHandler, createCategoryHandler, editCategoryHandler, deleteCategoryHandler, listServersHandler, kickMemberHandler, banMemberHandler, unbanMemberHandler, timeoutMemberHandler, disconnectMemberHandler, moveMemberHandler, removeTimeoutHandler, bulkDeleteMessagesHandler, setNicknameHandler, getBansHandler, softbanMemberHandler, pinMessageHandler, unpinMessageHandler, addRoleToMemberHandler, removeRoleFromMemberHandler, createRoleHandler, editRoleHandler, deleteRoleHandler, listRolesHandler, disconnectVoiceHandler, moveVoiceHandler, voiceMuteHandler, voiceDeafenHandler, getMemberInfoHandler, listMembersHandler, dmMemberHandler, createInviteHandler, getInvitesHandler, getChannelInvitesHandler, getVanityUrlHandler, getAuditLogsHandler, listEmojisHandler, createEmojiHandler, deleteEmojiHandler, setSlowmodeHandler, lockChannelHandler, unlockChannelHandler };
// Create tool context
export function createToolContext(client) {
    return { client };
}
