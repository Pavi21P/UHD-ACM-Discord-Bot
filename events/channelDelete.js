const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!channel.guild) return;

    try {
      await sendGuildLog(channel.guild, {
        title: '🧹 Channel Deleted',
        color: 0xe74c3c,
        fields: [
          { name: 'Name', value: `${channel.name}`, inline: true },
          { name: 'Type', value: `${channel.type}`, inline: true },
          { name: 'ID', value: channel.id, inline: false }
        ]
      });
    } catch (error) {
      console.error('Failed to log channel delete:', error);
    }
  }
};
