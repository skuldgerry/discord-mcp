import assert from "node:assert/strict";
import test from "node:test";
import { DMMemberSchema } from "../build/schemas.js";
import { dmMemberHandler } from "../build/tools/members.js";
import { sendMessageHandler } from "../build/tools/send-message.js";
import { toolList } from "../build/toolList.js";

const userId = "111111111111111111";
const dmChannelId = "222222222222222222";
const messageId = "333333333333333333";

test("discord_dm_member sends typed Media Gallery silently with empty mentions", async () => {
  let payload;
  const client = {
    isReady: () => true,
    users: {
      fetch: async () => ({
        createDM: async () => ({
          send: async value => {
            payload = value;
            return {
              channelId: dmChannelId,
              id: messageId,
              url: `https://discord.com/channels/@me/${dmChannelId}/${messageId}`,
            };
          },
        }),
      }),
    },
  };

  const response = await dmMemberHandler({
    userId,
    components: [{
      type: "media_gallery",
      items: [{
        url: "https://example.com/guide-image.png",
        spoiler: false,
      }],
    }],
    allowedMentions: {},
    suppressNotifications: true,
  }, { client });

  assert.deepEqual(payload.flags, ["IsComponentsV2", "SuppressNotifications"]);
  assert.deepEqual(payload.allowedMentions, {});
  assert.equal(payload.components.length, 1);
  const gallery = payload.components[0].toJSON();
  assert.equal(gallery.type, 12);
  assert.equal(gallery.items[0].media.url, "https://example.com/guide-image.png");
  assert.equal(gallery.items[0].spoiler, false);
  assert.deepEqual(response.structuredContent, {
    userId,
    channelId: dmChannelId,
    messageId,
    url: `https://discord.com/channels/@me/${dmChannelId}/${messageId}`,
    componentsV2: true,
    suppressedNotifications: true,
    replyToMessageId: null,
  });
});

test("DM schema preserves text mode and enforces exactly one message mode", () => {
  assert.equal(DMMemberSchema.safeParse({ userId, message: "hello" }).success, true);
  assert.equal(DMMemberSchema.safeParse({ userId }).success, false);
  assert.equal(DMMemberSchema.safeParse({
    userId,
    message: "hello",
    components: [{ type: "text_display", content: "hello" }],
  }).success, false);
});

test("existing discord_send text mode still uses the shared payload and stable result", async () => {
  let payload;
  const client = {
    isReady: () => true,
    channels: {
      fetch: async () => ({
        isTextBased: () => true,
        send: async value => {
          payload = value;
          return {
            channelId: dmChannelId,
            id: messageId,
            url: `https://discord.com/channels/${dmChannelId}/${messageId}`,
          };
        },
      }),
    },
  };

  const response = await sendMessageHandler({
    channelId: dmChannelId,
    content: "**Guide ready**",
    allowedMentions: {},
    suppressNotifications: true,
  }, { client });

  assert.equal(payload.content, "**Guide ready**");
  assert.deepEqual(payload.allowedMentions, {});
  assert.deepEqual(payload.flags, ["SuppressNotifications"]);
  assert.equal(response.structuredContent.channelId, dmChannelId);
  assert.equal(response.structuredContent.messageId, messageId);
  assert.match(response.structuredContent.url, /^https:\/\/discord\.com\//);
});

test("new tools and existing discord_send are all advertised with useful outputs", () => {
  const names = new Set(toolList.map(tool => tool.name));
  for (const name of [
    "discord_send",
    "discord_dm_member",
    "discord_edit_channel",
    "discord_get_channel_info",
    "discord_create_voice_channel",
    "discord_create_thread",
    "discord_edit_thread",
    "discord_set_channel_permission_overwrites",
    "discord_cutover_categories",
  ]) {
    assert.equal(names.has(name), true, `${name} should be advertised`);
  }

  const dmTool = toolList.find(tool => tool.name === "discord_dm_member");
  assert.deepEqual(dmTool.outputSchema.required, ["channelId", "messageId", "url"]);
  assert.equal(dmTool.outputSchema.properties.url.type, "string");
});
