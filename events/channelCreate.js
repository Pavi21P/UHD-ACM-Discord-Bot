const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.ChannelCreate,
  async execute(channel) {
    if (!channel.guild) return;

    try {
      await sendGuildLog(channel.guild, {
        title: '📁 Channel Created',
        color: 0x3498db,
        fields: [
          { name: 'Channel', value: `${channel}`, inline: true },
          { name: 'Type', value: `${channel.type}`, inline: true },
          { name: 'ID', value: channel.id, inline: false }
        ]
      });
    } catch (error) {
      console.error('Failed to log channel create:', error);
    }
  }
};
