const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const store = require('../helper/qotdStore');
module.exports = {
  data: new SlashCommandBuilder().setName('qotd').setDescription('Question of the Day commands')
    .addSubcommand(s => s.setName('submit').setDescription('Submit a question')
      .addStringOption(o => o.setName('question').setDescription('Your question').setRequired(true).setMinLength(1).setMaxLength(1500)))
    .addSubcommand(s => s.setName('delete').setDescription('Delete your question (moderators can delete any)')
      .addIntegerOption(o => o.setName('number').setDescription('Question number from the list').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('list').setDescription('View queued questions')
      .addIntegerOption(o => o.setName('page').setDescription('Page number').setMinValue(1))),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const channelId = process.env.QOTD_CHANNEL_ID;
    if (!channelId) return interaction.editReply('QOTD is disabled. Set QOTD_CHANNEL_ID first.');
    const channel = await interaction.client.channels.fetch(channelId);
    if (channel?.guildId !== interaction.guildId) return interaction.editReply('QOTD is configured for a different server.');
    const sub = interaction.options.getSubcommand();
    if (sub === 'submit') {
      const question = interaction.options.getString('question', true).trim();
      if (!question || question.length > 1500) return interaction.editReply('Enter a question between 1 and 1500 characters.');
      const position = store.add({ question, submittedBy: interaction.user.tag, userId: interaction.user.id, guildId: interaction.guildId });
      return interaction.editReply('Your question was added at position #' + position + '.');
    }
    const queue = store.load();
    if (sub === 'list') {
      const page = interaction.options.getInteger('page') || 1;
      const pages = Math.max(1, Math.ceil(queue.length / 5));
      if (page > pages) return interaction.editReply('Choose a page from 1 to ' + pages + '.');
      const list = queue.slice((page - 1) * 5, page * 5).map((q, i) => '#' + ((page - 1) * 5 + i + 1) + ' — ' + q.question.replace(/\s+/g, ' ').slice(0, 220) + ' (by ' + String(q.submittedBy).slice(0, 40) + ')').join('\n');
      return interaction.editReply({ content: '**QOTD Queue — page ' + page + '/' + pages + '**\n' + (list || 'The queue is empty.'), allowedMentions: { parse: [] } });
    }
    const num = interaction.options.getInteger('number');
    const entry = queue[num - 1];
    if (!entry) return interaction.editReply('Invalid number. Use /qotd list first.');
    if (entry.userId !== interaction.user.id && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) return interaction.editReply('You can only delete your own questions. Moderators with Manage Messages can delete any.');
    store.remove(entry.id);
    await interaction.editReply('Removed question #' + num + '.');
  }
};
