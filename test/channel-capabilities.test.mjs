import assert from "node:assert/strict";
import test from "node:test";
import { ChannelType, PermissionsBitField } from "discord.js";
import {
  createCategoryHandler,
  createTextChannelHandler,
  cutoverCategoriesHandler,
  editChannelHandler,
  getChannelInfoHandler,
  setChannelPermissionOverwritesHandler,
} from "../build/tools/channel.js";
import {
  CreateTextChannelSchema,
  EditChannelSchema,
  PermissionOverwriteSchema,
} from "../build/schemas.js";

const guildId = "111111111111111111";
const oldCategoryId = "222222222222222222";
const newCategoryId = "333333333333333333";
const adminRoleId = "444444444444444444";

function readyClient(overrides = {}) {
  return {
    isReady: () => true,
    ...overrides,
  };
}

function permissionManager(overwrites) {
  return {
    cache: new Map(overwrites.map(overwrite => [
      overwrite.id,
      {
        id: overwrite.id,
        type: overwrite.type === "role" ? 0 : 1,
        allow: new PermissionsBitField(overwrite.allow ?? []),
        deny: new PermissionsBitField(overwrite.deny ?? []),
      },
    ])),
  };
}

test("category creation applies permission overwrites and returns stable IDs", async () => {
  let received;
  const guild = {
    id: guildId,
    channels: {
      create: async options => {
        received = options;
        return { id: newCategoryId, position: 7 };
      },
    },
  };
  const response = await createCategoryHandler({
    guildId,
    name: "Private WIP",
    position: 7,
    permissionOverwrites: [
      { id: guildId, type: "role", deny: ["ViewChannel"] },
      { id: adminRoleId, type: "role", allow: ["ViewChannel"] },
    ],
  }, {
    client: readyClient({ guilds: { fetch: async () => guild } }),
  });

  assert.equal(received.type, ChannelType.GuildCategory);
  assert.equal(received.position, 7);
  assert.equal(received.permissionOverwrites.length, 2);
  assert.equal(received.permissionOverwrites[0].deny.has("ViewChannel"), true);
  assert.equal(received.permissionOverwrites[1].allow.has("ViewChannel"), true);
  assert.deepEqual(response.structuredContent, {
    guildId,
    categoryId: newCategoryId,
    channelId: newCategoryId,
    position: 7,
  });
});

test("text-channel creation supports parent, position, and overwrites", async () => {
  let received;
  const channelId = "555555555555555555";
  const guild = {
    id: guildId,
    channels: {
      create: async options => {
        received = options;
        return {
          id: channelId,
          parentId: newCategoryId,
          position: 3,
        };
      },
    },
  };
  const response = await createTextChannelHandler({
    guildId,
    channelName: "boss-one",
    categoryId: newCategoryId,
    position: 3,
    permissionOverwrites: [
      { id: guildId, type: "role", deny: ["ViewChannel"] },
    ],
  }, {
    client: readyClient({ guilds: { fetch: async () => guild } }),
  });

  assert.equal(received.parent, newCategoryId);
  assert.equal(received.position, 3);
  assert.equal(received.permissionOverwrites[0].deny.has("ViewChannel"), true);
  assert.equal(response.structuredContent.channelId, channelId);
  assert.equal(response.structuredContent.parentId, newCategoryId);
});

test("channel editing moves between categories and replaces overwrites", async () => {
  let received;
  const channelId = "555555555555555555";
  const channel = {
    id: channelId,
    guild: { id: guildId },
    edit: async options => {
      received = options;
      return {
        id: channelId,
        guild: { id: guildId },
        parentId: newCategoryId,
        position: 4,
      };
    },
  };
  const response = await editChannelHandler({
    channelId,
    parentId: newCategoryId,
    position: 4,
    permissionOverwrites: [
      { id: adminRoleId, type: "role", allow: ["ViewChannel"] },
    ],
  }, {
    client: readyClient({ channels: { fetch: async () => channel } }),
  });

  assert.equal(received.parent, newCategoryId);
  assert.equal(received.position, 4);
  assert.equal(received.permissionOverwrites[0].allow.has("ViewChannel"), true);
  assert.equal(response.structuredContent.categoryId, newCategoryId);
  assert.equal(response.structuredContent.lockPermissionsRequested, null);
  assert.equal(response.structuredContent.lockPermissionsApplied, null);
});

test("channel movement with lock uses Discord native permission synchronization", async () => {
  const channelId = "555555555555555555";
  const parentPermissions = permissionManager([
    { id: guildId, type: "role", deny: ["ViewChannel"] },
    { id: adminRoleId, type: "role", allow: ["ViewChannel"] },
  ]);
  const parent = {
    id: newCategoryId,
    type: ChannelType.GuildCategory,
    permissionOverwrites: parentPermissions,
  };
  let received;
  const channel = {
    id: channelId,
    guild: { id: guildId },
    parentId: oldCategoryId,
    position: 4,
    permissionOverwrites: permissionManager([
      { id: guildId, type: "role", allow: ["ViewChannel"] },
    ]),
    setParent: async (parentId, options) => {
      received = { parentId, options };
      return {
        ...channel,
        parentId,
        permissionOverwrites: parentPermissions,
      };
    },
    edit: async () => assert.fail("a parent-only locked move must not issue a second edit"),
  };
  const response = await editChannelHandler({
    channelId,
    parentId: newCategoryId,
    lockPermissions: true,
  }, {
    client: readyClient({
      channels: {
        fetch: async id => id === channelId ? channel : parent,
      },
    }),
  });

  assert.deepEqual(received, {
    parentId: newCategoryId,
    options: { lockPermissions: true },
  });
  assert.equal(response.structuredContent.lockPermissionsRequested, true);
  assert.equal(response.structuredContent.lockPermissionsApplied, true);
  assert.equal(response.structuredContent.permissionsSynced, true);
});

test("channel movement without lock explicitly preserves independent overwrites", async () => {
  const channelId = "555555555555555555";
  const channelPermissions = permissionManager([
    { id: guildId, type: "role", allow: ["ViewChannel"] },
  ]);
  const parent = {
    id: newCategoryId,
    type: ChannelType.GuildCategory,
    permissionOverwrites: permissionManager([
      { id: guildId, type: "role", deny: ["ViewChannel"] },
    ]),
  };
  let received;
  const channel = {
    id: channelId,
    guild: { id: guildId },
    parentId: oldCategoryId,
    position: 4,
    permissionOverwrites: channelPermissions,
    setParent: async (parentId, options) => {
      received = { parentId, options };
      return { ...channel, parentId };
    },
    edit: async () => assert.fail("a parent-only unlocked move must not issue a second edit"),
  };
  const response = await editChannelHandler({
    channelId,
    categoryId: newCategoryId,
    lockPermissions: false,
  }, {
    client: readyClient({
      channels: {
        fetch: async id => id === channelId ? channel : parent,
      },
    }),
  });

  assert.deepEqual(received, {
    parentId: newCategoryId,
    options: { lockPermissions: false },
  });
  assert.equal(response.structuredContent.lockPermissionsRequested, false);
  assert.equal(response.structuredContent.lockPermissionsApplied, false);
  assert.equal(response.structuredContent.permissionsSynced, false);
});

test("parent-only movement does not imply permission synchronization", async () => {
  const channelId = "555555555555555555";
  let received;
  const channel = {
    id: channelId,
    guild: { id: guildId },
    edit: async options => {
      received = options;
      return {
        ...channel,
        parentId: newCategoryId,
        position: 4,
      };
    },
  };
  const response = await editChannelHandler({
    channelId,
    parentId: newCategoryId,
  }, {
    client: readyClient({ channels: { fetch: async () => channel } }),
  });

  assert.deepEqual(received, { parent: newCategoryId });
  assert.equal(response.structuredContent.lockPermissionsRequested, null);
  assert.equal(response.structuredContent.lockPermissionsApplied, null);
  assert.equal(response.structuredContent.permissionsSynced, null);
});

test("channel info serializes permission names and compares normalized overwrites", async () => {
  const channelId = "555555555555555555";
  const parent = {
    id: newCategoryId,
    type: ChannelType.GuildCategory,
    permissionOverwrites: permissionManager([
      { id: adminRoleId, type: "role", allow: ["ViewChannel", "ManageChannels"] },
      { id: guildId, type: "role", deny: ["SendMessages", "ViewChannel"] },
    ]),
  };
  const channel = {
    id: channelId,
    type: ChannelType.GuildText,
    guild: { id: guildId },
    name: "boss-one",
    parentId: newCategoryId,
    position: 3,
    topic: "Raid guide",
    permissionOverwrites: permissionManager([
      { id: guildId, type: "role", deny: ["ViewChannel", "SendMessages"] },
      { id: adminRoleId, type: "role", allow: ["ManageChannels", "ViewChannel"] },
    ]),
  };
  const response = await getChannelInfoHandler({ channelId }, {
    client: readyClient({
      channels: {
        fetch: async id => id === channelId ? channel : parent,
      },
    }),
  });

  assert.deepEqual(response.structuredContent, {
    guildId,
    channelId,
    name: "boss-one",
    type: "GuildText",
    parentId: newCategoryId,
    categoryId: newCategoryId,
    position: 3,
    topic: "Raid guide",
    nsfw: null,
    rateLimitPerUserSeconds: null,
    bitrate: null,
    userLimit: null,
    rtcRegion: null,
    videoQualityMode: null,
    defaultAutoArchiveDuration: null,
    permissionOverwrites: [
      {
        id: guildId,
        type: "role",
        allow: [],
        deny: ["SendMessages", "ViewChannel"],
      },
      {
        id: adminRoleId,
        type: "role",
        allow: ["ManageChannels", "ViewChannel"],
        deny: [],
      },
    ],
    permissionsSynced: true,
  });
});

test("channel info supports root categories", async () => {
  const category = {
    id: newCategoryId,
    type: ChannelType.GuildCategory,
    guild: { id: guildId },
    name: "Private WIP",
    parentId: null,
    position: 2,
    permissionOverwrites: permissionManager([]),
  };
  const response = await getChannelInfoHandler({ channelId: newCategoryId }, {
    client: readyClient({ channels: { fetch: async () => category } }),
  });

  assert.equal(response.structuredContent.type, "GuildCategory");
  assert.equal(response.structuredContent.parentId, null);
  assert.equal(response.structuredContent.topic, null);
  assert.equal(response.structuredContent.permissionsSynced, null);
});

test("standalone overwrite replacement supports post-creation permission changes", async () => {
  let received;
  const channelId = "555555555555555555";
  const channel = {
    id: channelId,
    guild: { id: guildId },
    permissionOverwrites: {
      set: async (overwrites, reason) => {
        received = { overwrites, reason };
      },
    },
  };
  const response = await setChannelPermissionOverwritesHandler({
    channelId,
    permissionOverwrites: [
      { id: guildId, type: "role", deny: ["ViewChannel"] },
      { id: adminRoleId, type: "role", allow: ["ViewChannel"] },
    ],
    reason: "Prepare private WIP",
  }, {
    client: readyClient({ channels: { fetch: async () => channel } }),
  });

  assert.equal(received.reason, "Prepare private WIP");
  assert.equal(received.overwrites[0].deny.has("ViewChannel"), true);
  assert.equal(received.overwrites[1].allow.has("ViewChannel"), true);
  assert.equal(response.structuredContent.overwriteCount, 2);
});

test("category cutover hides old, repositions, then reveals new", async () => {
  const events = [];
  const guild = {
    id: guildId,
    channels: {
      setPositions: async positions => {
        events.push(["positions", positions]);
      },
    },
  };
  const oldCategory = {
    id: oldCategoryId,
    type: ChannelType.GuildCategory,
    guild,
    permissionOverwrites: {
      set: async () => events.push(["hideOld"]),
    },
  };
  const newCategory = {
    id: newCategoryId,
    type: ChannelType.GuildCategory,
    guild,
    permissionOverwrites: {
      set: async () => events.push(["revealNew"]),
    },
  };
  const client = readyClient({
    channels: {
      fetch: async id => id === oldCategoryId ? oldCategory : newCategory,
    },
  });

  const response = await cutoverCategoriesHandler({
    oldCategoryId,
    newCategoryId,
    oldPosition: 20,
    newPosition: 2,
    oldPermissionOverwrites: [
      { id: guildId, type: "role", deny: ["ViewChannel"] },
    ],
    newPermissionOverwrites: [
      { id: guildId, type: "role", allow: ["ViewChannel"] },
    ],
  }, { client });

  assert.deepEqual(events.map(event => event[0]), [
    "hideOld",
    "positions",
    "revealNew",
  ]);
  assert.deepEqual(response.structuredContent.safetyOrder, [
    "hideOld",
    "reposition",
    "revealNew",
  ]);
});

test("category cutover refuses an old category that is not hidden from @everyone", async () => {
  const guild = {
    id: guildId,
    channels: { setPositions: async () => assert.fail("must not reposition") },
  };
  const oldCategory = {
    id: oldCategoryId,
    type: ChannelType.GuildCategory,
    guild,
    permissionOverwrites: { set: async () => assert.fail("must not mutate") },
  };
  const newCategory = {
    id: newCategoryId,
    type: ChannelType.GuildCategory,
    guild,
    permissionOverwrites: { set: async () => assert.fail("must not mutate") },
  };
  const response = await cutoverCategoriesHandler({
    oldCategoryId,
    newCategoryId,
    oldPosition: 20,
    newPosition: 2,
    oldPermissionOverwrites: [],
    newPermissionOverwrites: [],
  }, {
    client: readyClient({
      channels: {
        fetch: async id => id === oldCategoryId ? oldCategory : newCategory,
      },
    }),
  });

  assert.equal(response.isError, true);
  assert.match(response.content[0].text, /deny ViewChannel/);
});

test("schemas reject ambiguous parents and conflicting overwrite permissions", () => {
  assert.equal(CreateTextChannelSchema.safeParse({
    guildId,
    channelName: "boss-one",
    parentId: oldCategoryId,
    categoryId: newCategoryId,
  }).success, false);

  assert.equal(PermissionOverwriteSchema.safeParse({
    id: guildId,
    type: "role",
    allow: ["ViewChannel"],
    deny: ["ViewChannel"],
  }).success, false);

  assert.equal(EditChannelSchema.safeParse({
    channelId: "555555555555555555",
    lockPermissions: true,
  }).success, false);

  assert.equal(EditChannelSchema.safeParse({
    channelId: "555555555555555555",
    parentId: newCategoryId,
    lockPermissions: true,
    permissionOverwrites: [],
  }).success, false);
});
