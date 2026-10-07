const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show info about a user')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to inspect')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const createdAt = Math.floor(targetUser.createdTimestamp / 1000);
    const joinedAt = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
    const roles = member
      ? member.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .map(role => `<@&${role.id}>`)
        .slice(0, 12)
      : [];

    const embed = new EmbedBuilder()
      .setTitle(`User info: ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
      .setColor(0x57f287)
      .addFields(
        { name: 'User ID', value: targetUser.id, inline: true },
        { name: 'Bot?', value: targetUser.bot ? 'Yes' : 'No', inline: true },
        { name: 'Account created', value: `<t:${createdAt}:F>`, inline: false }
      )
      .setTimestamp();

    if (joinedAt) {
      embed.addFields({ name: 'Joined server', value: `<t:${joinedAt}:F>`, inline: false });
    }

    if (roles.length) {
      embed.addFields({ name: `Roles (${roles.length})`, value: roles.join(', '), inline: false });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
