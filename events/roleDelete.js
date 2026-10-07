const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.GuildRoleDelete,
  async execute(role) {
    try {
      await sendGuildLog(role.guild, {
        title: '❌ Role Deleted',
        color: 0xe74c3c,
        fields: [
          { name: 'Role Name', value: role.name, inline: true },
          { name: 'ID', value: role.id, inline: true }
        ]
      });
    } catch (error) {
      console.error('Failed to log role delete:', error);
    }
  }
};
