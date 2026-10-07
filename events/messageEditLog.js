const { Events } = require('discord.js');
const { editedMessages } = require('./messageLog');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    editedMessages.unshift({
      author: oldMessage.author?.tag || 'Unknown',
      channel: oldMessage.channelId,
      before: oldMessage.content || '*No content*',
      after: newMessage.content || '*No content*',
      time: new Date().toISOString()
    });

    if (editedMessages.length > 100) editedMessages.pop();
  }
};