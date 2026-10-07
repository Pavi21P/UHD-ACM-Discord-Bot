const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Show a user avatar')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to view')
        .setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;
    const avatarUrl = target.displayAvatarURL({ size: 1024, extension: 'png' });

    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s avatar`)
      .setImage(avatarUrl)
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  }
};
