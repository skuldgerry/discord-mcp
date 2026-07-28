import assert from "node:assert/strict";
import test from "node:test";
import { ChannelType, VideoQualityMode } from "discord.js";
import {
  CreateThreadSchema,
  ReadMessagesSchema,
  SendMessageSchema,
} from "../build/schemas.js";
import {
  createVoiceChannelHandler,
  createThreadHandler,
  editChannelHandler,
  editThreadHandler,
  getChannelInfoHandler,
  readMessagesHandler,
} from "../build/tools/channel.js";
import {
  buildMessageCreatePayload,
} from "../build/tools/send-message.js";
import { toolList } from "../build/toolList.js";

const guildId = "111111111111111111";
const channelId = "222222222222222222";
const parentId = "333333333333333333";
const messageId = "444444444444444444";
const threadId = "555555555555555555";

function readyClient(overrides = {}) {
  return {
    isReady: () => true,
    ...overrides,
  };
}

test("message payload supports native replies and validates reply options", () => {
  const { payload } = buildMessageCreatePayload({
    content: "Acknowledged",
    replyToMessageId: messageId,
    failIfNotExists: false,
  });

  assert.deepEqual(payload.reply, {
    messageReference: messageId,
    failIfNotExists: false,
  });
  assert.equal(SendMessageSchema.safeParse({
    channelId,
    content: "orphan option",
    failIfNotExists: false,
  }).success, false);
});

test("message reading passes exactly one pagination cursor and reports it", async () => {
  let fetchOptions;
  const createdAt = new Date("2026-07-28T12:00:00.000Z");
  const message = {
    id: messageId,
    content: "Historical message",
    author: { id: guildId, username: "member", bot: false },
    createdAt,
    editedAt: null,
    flags: { toArray: () => [] },
    pinned: false,
    components: [],
    attachments: [],
    embeds: [],
    poll: null,
    reference: null,
  };
  const messages = {
    size: 1,
    map: mapper => [mapper(message)],
  };
  const response = await readMessagesHandler({
    channelId,
    limit: 25,
    before: messageId,
  }, {
    client: readyClient({
      channels: {
        fetch: async () => ({
          isTextBased: () => true,
          messages: {
            fetch: async options => {
              fetchOptions = options;
              return messages;
            },
          },
        }),
      },
    }),
  });

  assert.deepEqual(fetchOptions, { limit: 25, before: messageId });
  assert.deepEqual(response.structuredContent.cursor, {
    before: messageId,
    after: null,
    around: null,
  });
  assert.equal(ReadMessagesSchema.safeParse({
    channelId,
    before: messageId,
    after: threadId,
  }).success, false);
});

test("voice channel creation exposes hierarchy and voice settings", async () => {
  let received;
  const guild = {
    id: guildId,
    channels: {
      create: async options => {
        received = options;
        return {
          id: channelId,
          parentId,
          position: 2,
          bitrate: 96000,
          userLimit: 12,
          rtcRegion: null,
          videoQualityMode: VideoQualityMode.Full,
        };
      },
    },
  };
  const response = await createVoiceChannelHandler({
    guildId,
    channelName: "Operations",
    parentId,
    position: 2,
    bitrate: 96000,
    userLimit: 12,
    rtcRegion: null,
    videoQualityMode: "full",
  }, {
    client: readyClient({ guilds: { fetch: async () => guild } }),
  });

  assert.equal(received.type, ChannelType.GuildVoice);
  assert.equal(received.parent, parentId);
  assert.equal(received.videoQualityMode, VideoQualityMode.Full);
  assert.equal(response.structuredContent.channelId, channelId);
  assert.equal(response.structuredContent.bitrate, 96000);
});

test("generic channel edit forwards type-specific text and voice options", async () => {
  let received;
  const channel = {
    id: channelId,
    guild: { id: guildId },
    edit: async options => {
      received = options;
      return {
        ...channel,
        position: 2,
        parentId,
        nsfw: true,
        rateLimitPerUser: 30,
        bitrate: 128000,
        userLimit: 20,
        rtcRegion: "rotterdam",
        videoQualityMode: VideoQualityMode.Auto,
        defaultAutoArchiveDuration: 1440,
      };
    },
  };
  const response = await editChannelHandler({
    channelId,
    nsfw: true,
    rateLimitPerUserSeconds: 30,
    bitrate: 128000,
    userLimit: 20,
    rtcRegion: "rotterdam",
    videoQualityMode: "auto",
    defaultAutoArchiveDuration: 1440,
  }, {
    client: readyClient({ channels: { fetch: async () => channel } }),
  });

  assert.deepEqual(received, {
    nsfw: true,
    rateLimitPerUser: 30,
    bitrate: 128000,
    userLimit: 20,
    rtcRegion: "rotterdam",
    videoQualityMode: VideoQualityMode.Auto,
    defaultAutoArchiveDuration: 1440,
  });
  assert.equal(response.structuredContent.rateLimitPerUserSeconds, 30);
  assert.equal(response.structuredContent.userLimit, 20);
});

test("channel inspection returns type-specific voice settings", async () => {
  const voice = {
    id: channelId,
    type: ChannelType.GuildVoice,
    guild: { id: guildId },
    name: "Operations",
    parentId,
    position: 2,
    bitrate: 128000,
    userLimit: 20,
    rtcRegion: "rotterdam",
    videoQualityMode: VideoQualityMode.Full,
    permissionOverwrites: { cache: new Map() },
    isThread: () => false,
  };
  const parent = {
    id: parentId,
    permissionOverwrites: { cache: new Map() },
  };
  const response = await getChannelInfoHandler({ channelId }, {
    client: readyClient({
      channels: {
        fetch: async id => id === channelId ? voice : parent,
      },
    }),
  });

  assert.equal(response.structuredContent.type, "GuildVoice");
  assert.equal(response.structuredContent.bitrate, 128000);
  assert.equal(response.structuredContent.userLimit, 20);
  assert.equal(response.structuredContent.rtcRegion, "rotterdam");
  assert.equal(response.structuredContent.permissionsSynced, true);
});

test("thread creation maps public/private options and returns stable identifiers", async () => {
  let received;
  const thread = {
    id: threadId,
    guildId,
    parentId: channelId,
    name: "Incident review",
    type: ChannelType.PrivateThread,
    ownerId: guildId,
    archived: false,
    locked: false,
    invitable: false,
    autoArchiveDuration: 1440,
    rateLimitPerUser: 15,
    messageCount: 0,
    memberCount: 1,
    createdAt: new Date("2026-07-28T12:00:00.000Z"),
    archiveTimestamp: null,
    url: `https://discord.com/channels/${guildId}/${threadId}`,
  };
  const parent = {
    type: ChannelType.GuildText,
    threads: {
      create: async options => {
        received = options;
        return thread;
      },
    },
  };
  const response = await createThreadHandler({
    channelId,
    name: "Incident review",
    type: "private",
    invitable: false,
    autoArchiveDuration: 1440,
    rateLimitPerUserSeconds: 15,
  }, {
    client: readyClient({ channels: { fetch: async () => parent } }),
  });

  assert.deepEqual(received, {
    name: "Incident review",
    type: ChannelType.PrivateThread,
    autoArchiveDuration: 1440,
    rateLimitPerUser: 15,
    invitable: false,
  });
  assert.equal(response.structuredContent.threadId, threadId);
  assert.equal(response.structuredContent.channelId, threadId);
  assert.equal(CreateThreadSchema.safeParse({
    channelId,
    name: "invalid",
    type: "public",
    invitable: true,
  }).success, false);
});

test("thread editing supports archive and lock lifecycle controls", async () => {
  let received;
  const thread = {
    id: threadId,
    guildId,
    parentId: channelId,
    name: "Incident review",
    type: ChannelType.PublicThread,
    archived: false,
    locked: false,
    isThread: () => true,
    edit: async options => {
      received = options;
      return {
        ...thread,
        archived: true,
        locked: true,
        autoArchiveDuration: 4320,
        rateLimitPerUser: 60,
      };
    },
  };
  const response = await editThreadHandler({
    threadId,
    archived: true,
    locked: true,
    autoArchiveDuration: 4320,
    rateLimitPerUserSeconds: 60,
    reason: "Close completed incident",
  }, {
    client: readyClient({ channels: { fetch: async () => thread } }),
  });

  assert.deepEqual(received, {
    archived: true,
    locked: true,
    autoArchiveDuration: 4320,
    rateLimitPerUser: 60,
    reason: "Close completed incident",
  });
  assert.equal(response.structuredContent.archived, true);
  assert.equal(response.structuredContent.locked, true);
});

test("general capability tools are advertised once through the canonical catalog", () => {
  const names = toolList.map(tool => tool.name);
  assert.equal(names.length, 75);
  assert.equal(new Set(names).size, 75);
  for (const name of [
    "discord_create_voice_channel",
    "discord_create_thread",
    "discord_edit_thread",
  ]) {
    assert.equal(names.includes(name), true, `${name} should be advertised`);
  }
});
