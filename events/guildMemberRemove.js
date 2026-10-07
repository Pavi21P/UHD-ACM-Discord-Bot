const { Events } = require('discord.js');
const { sendGuildLog } = require('../commands/helper/serverLogger');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      await sendGuildLog(member.guild, {
        title: '🚪 Member Left',
        color: 0xed4245,
        fields: [
          { name: 'User', value: `${member.user.tag} (${member.id})`, inline: false },
          { name: 'Joined Server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: false }
        ]
      });
    } catch (error) {
      console.error('Failed to log member leave:', error);
    }
  }
};
