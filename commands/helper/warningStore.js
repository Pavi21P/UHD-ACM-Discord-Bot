const path = require('node:path');
const { readJson, writeJson } = require('./jsonStore');
function createWarningStore(file = path.join(__dirname, '..', 'json-logs', 'warnings.json'), legacyGuildId = process.env.LEGACY_WARNINGS_GUILD_ID || process.env.GUILD_ID) {
  function scoped(guildId) {
    if (!guildId) throw new Error('A guild ID is required for warnings');
    const raw = readJson(file, {});
    const data = raw.version === 2 ? raw : { version: 2, guilds: {}, legacy: raw };
    if (legacyGuildId && Object.keys(data.legacy || {}).length) {
      const destination = data.guilds[legacyGuildId] ||= {};
      for (const [id, records] of Object.entries(data.legacy)) destination[id] = [...(destination[id] || []), ...records];
      data.legacy = {};
    }
    return { data, users: data.guilds[guildId] ||= {} };
  }
  return {
    addWarning(guildId, userId, moderatorId, reason) {
      const { data, users } = scoped(guildId);
      (users[userId] ||= []).push({ reason, moderator: moderatorId, timestamp: new Date().toISOString() });
      writeJson(file, data);
    },
    getWarnings(guildId, userId) { return scoped(guildId).users[userId] || []; },
    clearWarnings(guildId, userId) {
      const { data, users } = scoped(guildId);
      if (!users[userId]?.length) return false;
      delete users[userId];
      writeJson(file, data);
      return true;
    }
  };
}
module.exports = { ...createWarningStore(), createWarningStore };
