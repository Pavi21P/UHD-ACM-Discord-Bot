const { Events } = require('discord.js');

const blacklistedWords = [
  // list here
  // 
];

const whitelistedWords = [
  'thor'
];

function matchesWord(content, word) {
  // Escape special regex characters in the word
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  return regex.test(content);
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    const hasWhitelistedWord = whitelistedWords.some(word => matchesWord(content, word));
    if (hasWhitelistedWord) return;

    const hasBlacklistedWord = blacklistedWords.some(word => matchesWord(content, word));

    const hasBlacklistedGif = message.attachments.some(a =>
      blacklistedWords.some(word => matchesWord(a.url.toLowerCase(), word))
    ) || message.embeds.some(e =>
      blacklistedWords.some(word =>
        matchesWord(e.url?.toLowerCase() || '', word) ||
        matchesWord(e.title?.toLowerCase() || '', word)
      )
    );

    if (hasBlacklistedWord || hasBlacklistedGif) {
      try {
        await message.delete();
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    }
  }
};