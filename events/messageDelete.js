const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    // Deleted messages cannot be fetched; log the metadata still available.

    const content = message.partial ? '(content not cached)' : (message.content?.trim() || '(no text content)');

    try {
      await sendGuildLog(message.guild, {
        title: '🗑️ Message Deleted',
        color: 0xe67e22,
        fields: [
          { name: 'Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown (not cached)', inline: false },
          { name: 'Channel', value: `${message.channel}`, inline: true },
          { name: 'Message ID', value: message.id, inline: true },
          { name: 'Content', value: content.slice(0, 1024), inline: false }
        ]
      });
    } catch (error) {
      console.error('Failed to log message delete:', error);
    }
  }
};
