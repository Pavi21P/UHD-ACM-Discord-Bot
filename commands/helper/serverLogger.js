const { EmbedBuilder } = require('discord.js');

function getLogChannel(guild) {
  return guild.channels.cache.find(
    ch => (ch.name === 'audit-logs' || ch.name === 'server-logs') && ch.isTextBased()
  );
}

async function sendGuildLog(guild, { title, color = 0x5865f2, fields = [], footer = null }) {
  const channel = getLogChannel(guild);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp();

  if (fields.length) {
    embed.addFields(fields);
  }

  if (footer) {
    embed.setFooter({ text: footer });
  }

  await channel.send({ embeds: [embed] });
}

/** DM one user when the bot shuts down gracefully (SIGINT/SIGTERM). Set SHUTDOWN_NOTIFY_USER_ID in .env */
async function sendShutdownDm(client, reason) {
  const userId = process.env.SHUTDOWN_NOTIFY_USER_ID || process.env.OWNER_USER_ID;
  if (!userId) return;

  try {
    const user = await client.users.fetch(userId);
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('Bot is going offline')
          .setDescription(
            `**${client.user?.tag ?? 'Bot'}** is shutting down.\n**Reason:** ${reason}`
          )
          .setColor(0xed4245)
          .setTimestamp()
      ]
    });
  } catch (err) {
    console.error('Could not send shutdown DM (check SHUTDOWN_NOTIFY_USER_ID and DM privacy):', err.message);
  }
}

module.exports = {
  getLogChannel,
  sendGuildLog,
  sendShutdownDm
};
