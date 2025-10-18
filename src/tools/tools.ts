import { Client } from "discord.js";
import { z } from "zod";
import { ToolResponse, ToolContext, ToolHandler } from "./types.js";
import { loginHandler } from './login.js';
import { sendMessageHandler } from './send-message.js';
import { 
  getForumChannelsHandler, 
  createForumPostHandler, 
  getForumPostHandler, 
  replyToForumHandler,
  deleteForumPostHandler
} from './forum.js';
import {
  createTextChannelHandler,
  deleteChannelHandler,
  readMessagesHandler,
  getServerInfoHandler,
  createCategoryHandler,
  editCategoryHandler,
  deleteCategoryHandler,
  listServersHandler,
  setSlowmodeHandler,
  lockChannelHandler,
  unlockChannelHandler
} from './channel.js';
import {
  addReactionHandler,
  addMultipleReactionsHandler,
  removeReactionHandler,
  deleteMessageHandler
} from './reactions.js';
import {
  createWebhookHandler,
  sendWebhookMessageHandler,
  editWebhookHandler,
  deleteWebhookHandler
} from './webhooks.js';
import {
  kickMemberHandler,
  banMemberHandler,
  unbanMemberHandler,
  timeoutMemberHandler,
  disconnectMemberHandler,
  moveMemberHandler,
  removeTimeoutHandler,
  bulkDeleteMessagesHandler,
  setNicknameHandler,
  getBansHandler,
  softbanMemberHandler,
  pinMessageHandler,
  unpinMessageHandler
} from './moderation.js';
import {
  addRoleToMemberHandler,
  removeRoleFromMemberHandler,
  createRoleHandler,
  editRoleHandler,
  deleteRoleHandler
} from './roles.js';
import { listRolesHandler } from './roles.js';
import {
  disconnectVoiceHandler,
  moveVoiceHandler,
  voiceMuteHandler,
  voiceDeafenHandler
} from './voice.js';
import {
  getMemberInfoHandler,
  listMembersHandler,
  dmMemberHandler
} from './members.js';
import {
  createInviteHandler,
  getInvitesHandler,
  getChannelInvitesHandler,
  getVanityUrlHandler
} from './invites.js';
import { getAuditLogsHandler } from './audit.js';
import { listEmojisHandler, createEmojiHandler, deleteEmojiHandler } from './emojis.js';

// Export tool handlers
export {
  loginHandler,
  sendMessageHandler,
  getForumChannelsHandler,
  createForumPostHandler,
  getForumPostHandler,
  replyToForumHandler,
  deleteForumPostHandler,
  createTextChannelHandler,
  deleteChannelHandler,
  readMessagesHandler,
  getServerInfoHandler,
  addReactionHandler,
  addMultipleReactionsHandler,
  removeReactionHandler,
  deleteMessageHandler,
  createWebhookHandler,
  sendWebhookMessageHandler,
  editWebhookHandler,
  deleteWebhookHandler,
  createCategoryHandler,
  editCategoryHandler,
  deleteCategoryHandler,
  listServersHandler,
  // moderation
  kickMemberHandler,
  banMemberHandler,
  unbanMemberHandler,
  timeoutMemberHandler,
  disconnectMemberHandler,
  moveMemberHandler,
  removeTimeoutHandler,
  bulkDeleteMessagesHandler,
  setNicknameHandler,
  getBansHandler,
  softbanMemberHandler,
  pinMessageHandler,
  unpinMessageHandler,
  // roles
  addRoleToMemberHandler,
  removeRoleFromMemberHandler,
  createRoleHandler,
  editRoleHandler,
  deleteRoleHandler,
  listRolesHandler,
  // voice
  disconnectVoiceHandler,
  moveVoiceHandler,
  voiceMuteHandler,
  voiceDeafenHandler,
  // members
  getMemberInfoHandler,
  listMembersHandler,
  dmMemberHandler,
  // invites
  createInviteHandler,
  getInvitesHandler,
  getChannelInvitesHandler,
  getVanityUrlHandler,
  // audit
  getAuditLogsHandler,
  // emojis
  listEmojisHandler,
  createEmojiHandler,
  deleteEmojiHandler,
  // channel extras
  setSlowmodeHandler,
  lockChannelHandler,
  unlockChannelHandler
};

// Export common types
export { ToolResponse, ToolContext, ToolHandler };

// Create tool context
export function createToolContext(client: Client): ToolContext {
  return { client };
} 