const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PermissionFlagsBits: P } = require('discord.js');
const { createWarningStore } = require('../commands/helper/warningStore');
const { createQotdStore } = require('../commands/helper/qotdStore');
const { nextPostTime, postNext } = require('../commands/helper/qotdScheduler');
const { canModerate, createModerationCommand } = require('../commands/helper/moderation');

function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acmuhd-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'data.json');
}
function member(id, position, permissions = []) {
  return { id, user: { id, tag: id }, permissions: { has: p => permissions.includes(p) },
    roles: { highest: { position, comparePositionTo: role => position - role.position }, cache: new Map() } };
}
function interaction(actor, target, permission, duration = 10) {
  const responses = [];
  const i = { responses, user: { id: actor.id }, client: { user: { id: 'bot' } },
    inGuild: () => true, memberPermissions: { has: p => p === permission },
    guild: { ownerId: 'owner', members: { fetch: async id => id === actor.id ? actor : target } },
    options: { getUser: () => ({ id: target.id }), getString: () => 'Test reason', getInteger: () => duration },
    deferReply: async () => {}, reply: async r => responses.push(r), editReply: async r => responses.push(r) };
  // Logging is deliberately inert in tests.
  i.guild.channels = { cache: { find: () => null } };
  return i;
}

test('warning history is isolated by guild and clear does not affect another server', t => {
  const store = createWarningStore(temp(t), '');
  store.addWarning('one', 'user', 'mod', 'first');
  store.addWarning('two', 'user', 'mod', 'second');
  store.clearWarnings('one', 'user');
  assert.equal(store.getWarnings('one', 'user').length, 0);
  assert.equal(store.getWarnings('two', 'user')[0].reason, 'second');
});
test('legacy warnings migrate only to the explicitly assigned guild', t => {
  const file = temp(t);
  const legacy = { user: [{ reason: 'old', moderator: 'mod', timestamp: '2026-01-01' }] };
  fs.writeFileSync(file, JSON.stringify(legacy));
  const unassigned = createWarningStore(file, '');
  assert.deepEqual(unassigned.getWarnings('other', 'user'), []);
  unassigned.addWarning('other', 'newUser', 'mod', 'new');
  assert.deepEqual(JSON.parse(fs.readFileSync(file)).legacy, legacy);
  const assigned = createWarningStore(file, 'original');
  assert.equal(assigned.getWarnings('original', 'user')[0].reason, 'old');
  assert.deepEqual(assigned.getWarnings('other', 'user'), []);
  assigned.addWarning('original', 'user', 'mod', 'later');
  assert.equal(assigned.getWarnings('original', 'user').length, 2);
});
test('corrupt warning JSON is not overwritten', t => {
  const file = temp(t); fs.writeFileSync(file, '{broken');
  assert.throws(() => createWarningStore(file, '').addWarning('g', 'u', 'm', 'r'));
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
});
for (const [input, expected] of [
  ['2026-07-01T14:00:00Z', '2026-07-01T15:00:00.000Z'],
  ['2026-12-01T14:00:00Z', '2026-12-01T16:00:00.000Z'],
  ['2026-03-07T17:00:00Z', '2026-03-08T15:00:00.000Z'],
  ['2026-10-31T17:00:00Z', '2026-11-01T16:00:00.000Z']
]) test('QOTD local 10am schedule from ' + input, () => {
  assert.equal(nextPostTime(new Date(input), 'America/Chicago').toISOString(), expected);
});
test('QOTD failure preserves queue across reload', async t => {
  const file = temp(t); const store = createQotdStore(file);
  store.add({ question: 'Keep me', submittedBy: 'user' });
  const client = { channels: { fetch: async () => ({ guildId: 'g', isTextBased: () => true, isSendable: () => true, send: async () => { throw new Error('Missing permissions'); } }) } };
  await assert.rejects(postNext(client, 'channel', store));
  assert.equal(createQotdStore(file).load()[0].question, 'Keep me');
});
test('successful QOTD preserves concurrent additions and suppresses mentions', async t => {
  const store = createQotdStore(temp(t)); store.add({ question: '@everyone', submittedBy: 'user' });
  const client = { channels: { fetch: async () => ({ guildId: 'g', isTextBased: () => true, isSendable: () => true, send: async payload => {
    assert.deepEqual(payload.allowedMentions.parse, []);
    store.add({ question: 'New question', submittedBy: 'other' });
  } }) } };
  await postNext(client, 'channel', store);
  assert.deepEqual(store.load().map(q => q.question), ['New question']);
});
test('QOTD refuses to send another guild question', async t => {
  const store = createQotdStore(temp(t)); store.add({ question: 'Private', guildId: 'one' });
  await assert.rejects(postNext({ channels: { fetch: async () => ({ guildId: 'two', isTextBased: () => true, isSendable: () => true }) } }, 'c', store), /another server/);
  assert.equal(store.load().length, 1);
});
test('moderation rejects equal/higher roles, self, owner and bot', () => {
  const actor = member('mod', 5);
  for (const target of [member('high', 6), member('equal', 5), member('mod', 1), member('owner', 1), member('bot', 1)]) assert.equal(canModerate(actor, target, 'owner', 'bot'), false);
  assert.equal(canModerate(actor, member('low', 1), 'owner', 'bot'), true);
  assert.equal(canModerate(member('owner', 0), member('high', 10), 'owner', 'bot'), true);
});
for (const [action, permission] of [['ban', P.BanMembers], ['kick', P.KickMembers]]) {
  test(action + ' rejects timeout-only permission', async () => {
    const actor = member('mod', 5, [P.ModerateMembers]);
    const i = interaction(actor, member('target', 1), P.ModerateMembers);
    await createModerationCommand(action).execute(i);
    assert.match(i.responses[0].content, /do not have permission/);
  });
  test(action + ' passes the correct reason argument', async () => {
    const actor = member('mod', 5, [permission]); const target = member('target', 1);
    target.bannable = target.kickable = true;
    let received; target[action] = async reason => { received = reason; };
    await createModerationCommand(action).execute(interaction(actor, target, permission));
    assert.deepEqual(received, action === 'ban' ? { reason: 'Test reason' } : 'Test reason');
  });
}
test('mute uses Discord timeout and validates duration', async () => {
  const actor = member('mod', 5, [P.ModerateMembers]); const target = member('target', 1);
  target.moderatable = true;
  const durations = []; target.timeout = async duration => durations.push(duration);
  for (const duration of [0, -1, 40321, 10]) await createModerationCommand('mute').execute(interaction(actor, target, P.ModerateMembers, duration));
  assert.deepEqual(durations, [600000]);
});
test('unmute removes an existing Discord timeout', async () => {
  const actor = member('mod', 5, [P.ModerateMembers]); const target = member('target', 1);
  target.roles.cache.find = () => undefined; target.isCommunicationDisabled = () => true; target.moderatable = true;
  let received; target.timeout = async duration => { received = duration; };
  const i = interaction(actor, target, P.ModerateMembers); i.guild.members.fetchMe = async () => member('bot', 10);
  await createModerationCommand('unmute').execute(i); assert.equal(received, null);
});
test('message edit tracker has a bounded working store', async () => {
  const { editedMessages } = require('../events/messageLog'); editedMessages.length = 0;
  const event = require('../events/messageEditLog');
  for (let n = 0; n < 105; n++) await event.execute({ author: { tag: 'user' }, content: 'before', channelId: 'c' }, { guild: {}, content: 'after' });
  assert.equal(editedMessages.length, 100);
});
test('DM commands are rejected before execution', async () => {
  let response;
  await require('../events/interactionCreate').execute({ isChatInputCommand: () => true, inGuild: () => false, reply: async r => { response = r; } });
  assert.match(response.content, /server/);
});

test('say blocks users lacking permission without sending a message', async () => {
  let response;
  await require('../commands/utility/say').execute({ memberPermissions: { has: () => false }, reply: async r => { response = r; } });
  assert.match(response.content, /Manage Messages/);
});
test('say verifies destination access and suppresses mentions', async () => {
  const actor = member('mod', 5, [P.ManageMessages]);
  const sent = []; const replies = [];
  let access = false;
  const channel = { guildId: 'g', isTextBased: () => true, isSendable: () => true, isThread: () => false,
    permissionsFor: () => ({ has: () => access }), send: async payload => sent.push(payload) };
  const i = { user: actor, guildId: 'g', memberPermissions: actor.permissions,
    guild: { members: { fetch: async () => actor, fetchMe: async () => member('bot', 10) } },
    options: { getChannel: () => channel, getString: () => '@everyone test' },
    deferReply: async () => {}, editReply: async r => replies.push(r) };
  const command = require('../commands/utility/say');
  await command.execute(i); assert.equal(sent.length, 0);
  access = true; await command.execute(i);
  assert.deepEqual(sent, [{ content: '@everyone test', allowedMentions: { parse: [] } }]);
});
test('QOTD delete protects other users and allows moderators', async t => {
  t.mock.method(require('../commands/helper/qotdStore'), 'load', () => [{ id: 'entry', userId: 'author', question: 'Question' }]);
  let removed;
  t.mock.method(require('../commands/helper/qotdStore'), 'remove', id => { removed = id; });
  const previous = process.env.QOTD_CHANNEL_ID;
  process.env.QOTD_CHANNEL_ID = 'channel';
  t.after(() => { if (previous === undefined) delete process.env.QOTD_CHANNEL_ID; else process.env.QOTD_CHANNEL_ID = previous; });
  let moderator = false;
  const i = { guildId: 'g', user: { id: 'someoneElse' }, client: { channels: { fetch: async () => ({ guildId: 'g' }) } },
    memberPermissions: { has: () => moderator }, options: { getSubcommand: () => 'delete', getInteger: () => 1 },
    deferReply: async () => {}, editReply: async () => {} };
  const command = require('../commands/utility/qotd');
  await command.execute(i); assert.equal(removed, undefined);
  moderator = true; await command.execute(i); assert.equal(removed, 'entry');
});
test('QOTD listing stays below Discord message limits', async t => {
  t.mock.method(require('../commands/helper/qotdStore'), 'load', () => Array.from({ length: 30 }, () => ({ question: 'x'.repeat(1500), submittedBy: 'user' })));
  const previous = process.env.QOTD_CHANNEL_ID; process.env.QOTD_CHANNEL_ID = 'channel';
  t.after(() => { if (previous === undefined) delete process.env.QOTD_CHANNEL_ID; else process.env.QOTD_CHANNEL_ID = previous; });
  let response;
  await require('../commands/utility/qotd').execute({ guildId: 'g', client: { channels: { fetch: async () => ({ guildId: 'g' }) } },
    options: { getSubcommand: () => 'list', getInteger: () => 2 }, deferReply: async () => {}, editReply: async r => { response = r; } });
  assert.ok(response.content.length <= 2000);
  assert.match(response.content, /page 2\/6/);
  assert.match(response.content, /#6/);
});
test('event failures are caught and logged', async t => {
  const errors = []; t.mock.method(console, 'error', (...args) => errors.push(args));
  await require('../commands/helper/eventRunner').runEvent({ name: 'test', execute: async () => { throw new Error('failure'); } });
  assert.equal(errors.length, 1);
});
test('expired error replies do not cause another unhandled rejection', async t => {
  t.mock.method(console, 'error', () => {});
  await require('../events/interactionCreate').execute({ commandName: 'test', isChatInputCommand: () => true, inGuild: () => true,
    client: { commands: new Map([['test', { execute: async () => { throw new Error('failure'); } }]]) },
    reply: async () => { throw new Error('Unknown interaction'); } });
});
test('legacy unmute removes the Muted role', async () => {
  const actor = member('mod', 5, [P.ModerateMembers]); const target = member('target', 1);
  const role = { id: 'muted', name: 'Muted', editable: true };
  target.roles.cache.find = () => role; target.isCommunicationDisabled = () => false; target.manageable = true;
  let removed; target.roles.remove = async r => { removed = r; };
  const i = interaction(actor, target, P.ModerateMembers);
  i.guild.members.fetchMe = async () => member('bot', 10, [P.ManageRoles]);
  await createModerationCommand('unmute').execute(i); assert.equal(removed, role);
});
test('sharp can create a GIF with the installed native dependency', async () => {
  const sharp = require('sharp');
  const output = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ff0000' } }).gif().toBuffer();
  assert.equal(output.subarray(0, 3).toString(), 'GIF');
});
