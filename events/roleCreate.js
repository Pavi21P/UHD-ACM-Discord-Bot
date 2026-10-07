const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    try {
      await sendGuildLog(role.guild, {
        title: '🆕 Role Created',
        color: role.color || 0x2ecc71,
        fields: [
          { name: 'Role', value: `<@&${role.id}>`, inline: true },
          { name: 'ID', value: role.id, inline: true }
        ]
      });
    } catch (error) {
      console.error('Failed to log role create:', error);
    }
  }
};
