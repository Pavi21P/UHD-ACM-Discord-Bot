const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Show info about a role')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Role to inspect')
        .setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const createdAt = Math.floor(role.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setTitle(`Role info: ${role.name}`)
      .setColor(role.color || 0x95a5a6)
      .addFields(
        { name: 'Role ID', value: role.id, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Created', value: `<t:${createdAt}:F>`, inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
