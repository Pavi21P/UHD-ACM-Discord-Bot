const { Events, MessageFlags } = require('discord.js');
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;
    try {
      if (!interaction.inGuild()) return await interaction.reply({ content: 'Use this command in a server.', flags: MessageFlags.Ephemeral });
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return await interaction.reply({ content: 'This command is unavailable. Please refresh the registered commands.', flags: MessageFlags.Ephemeral });
      await command.execute(interaction);
    } catch (error) {
      console.error('[Command ' + interaction.commandName + ']', error);
      try {
        const content = 'There was an error executing this command. Check the bot console.';
        if (interaction.deferred && !interaction.replied) await interaction.editReply({ content });
        else if (interaction.replied) await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
        else await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      } catch (replyError) { console.error('Unable to send command error response:', replyError.message); }
    }
  }
};
