const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;

    try {
      if (newMessage.partial) await newMessage.fetch();
    } catch {
      return;
    }

    const before = oldMessage.partial ? '(previous content not cached)' : (oldMessage.content?.trim() || '(no text content)');
    const after = newMessage.content?.trim() || '(no text content)';
    if (before === after) return;

    try {
      await sendGuildLog(newMessage.guild, {
        title: '✏️ Message Edited',
        color: 0xf1c40f,
        fields: [
          { name: 'Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: false },
          { name: 'Channel', value: `${newMessage.channel}`, inline: true },
          { name: 'Message Link', value: `[Jump](${newMessage.url})`, inline: true },
          { name: 'Before', value: before.slice(0, 1024), inline: false },
          { name: 'After', value: after.slice(0, 1024), inline: false }
        ]
      });
    } catch (error) {
      console.error('Failed to log message update:', error);
    }
  }
};