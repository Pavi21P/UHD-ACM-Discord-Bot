const { sendGuildLog } = require('./serverLogger');

async function logAction(guild, action, user, moderator, reason) {
  try {
    await sendGuildLog(guild, {
      title: `🔧 ${action}`,
      color: 0xff0000,
      fields: [
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag}`, inline: true },
      { name: 'Reason', value: reason || 'No reason provided', inline: false }
      ]
    });
  } catch (err) {
    console.error('Failed to send mod log:', err);
  }
}

module.exports = { logAction };