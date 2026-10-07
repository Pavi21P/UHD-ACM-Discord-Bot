const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('say').setDescription('Send a message through the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName('message').setDescription('Message').setRequired(true).setMaxLength(2000))
    .addChannelOption(o => o.setName('channel').setDescription('Destination').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: 'You need Manage Messages permission.', flags: MessageFlags.Ephemeral });
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    if (!channel?.isTextBased() || !channel.isSendable() || channel.guildId !== interaction.guildId) return interaction.editReply('Choose a sendable channel in this server.');
    const actor = await interaction.guild.members.fetch(interaction.user.id);
    const me = await interaction.guild.members.fetchMe();
    const required = [PermissionFlagsBits.ViewChannel, channel.isThread() ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages];
    if (!actor.permissions.has(PermissionFlagsBits.ManageMessages) || !channel.permissionsFor(actor)?.has(required) || !channel.permissionsFor(me)?.has(required)) return interaction.editReply('Both you and the bot must be allowed to view and send messages in that channel.');
    await channel.send({ content: interaction.options.getString('message', true), allowedMentions: { parse: [] } });
    await interaction.editReply('Sent!');
  }
};
