const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      await sendGuildLog(member.guild, {
        title: '✅ Member Joined',
        color: 0x57f287,
        fields: [
          { name: 'User', value: `${member.user.tag} (${member.id})`, inline: false },
          { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: false }
        ]
      });
    } catch (error) {
      console.error('Failed to log member join:', error);
    }
  }
};
