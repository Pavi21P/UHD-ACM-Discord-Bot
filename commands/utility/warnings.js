const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { getWarnings } = require('../helper/warningStore');
module.exports = {
  data: new SlashCommandBuilder().setName('warnings').setDescription('View warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('target').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('page').setDescription('Page number').setMinValue(1)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: 'You need Moderate Members permission.', flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('target', true);
    const warnings = getWarnings(interaction.guildId, target.id);
    const page = interaction.options.getInteger('page') || 1;
    const pages = Math.max(1, Math.ceil(warnings.length / 5));
    if (page > pages) return interaction.reply({ content: 'Choose a page from 1 to ' + pages + '.', flags: MessageFlags.Ephemeral });
    const embed = new EmbedBuilder().setTitle('Warnings for ' + target.tag).setColor(0xffcc00)
      .setDescription(warnings.length ? warnings.length + ' warning(s)' : 'No warnings.')
      .setFooter({ text: 'Page ' + page + '/' + pages });
    warnings.slice((page - 1) * 5, page * 5).forEach((warning, i) => embed.addFields({
      name: '#' + ((page - 1) * 5 + i + 1) + ' - ' + warning.timestamp,
      value: 'Reason: ' + String(warning.reason).slice(0, 800) + '\nModerator: <@' + warning.moderator + '>'
    }));
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  }
};
