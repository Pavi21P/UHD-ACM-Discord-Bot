const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { logAction } = require('./modlog');

function canModerate(actor, target, ownerId, botId) {
  return target && target.id !== actor.id && target.id !== botId && target.id !== ownerId &&
    (actor.id === ownerId || actor.roles.highest.comparePositionTo(target.roles.highest) > 0);
}

function createModerationCommand(action) {
  const permission = PermissionsBitField.Flags[
    action === 'ban' ? 'BanMembers' : action === 'kick' ? 'KickMembers' : 'ModerateMembers'
  ];
  const data = new SlashCommandBuilder().setName(action)
    .setDescription(`${action[0].toUpperCase() + action.slice(1)} a server member`)
    .setDMPermission(false).setDefaultMemberPermissions(permission)
    .addUserOption(o => o.setName('target').setDescription('Member to moderate').setRequired(true));
  if (action === 'mute') data.addIntegerOption(o => o.setName('duration')
    .setDescription('Timeout duration in minutes (1–40320)').setRequired(true).setMinValue(1).setMaxValue(40320));
  data.addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(512));
  return { data, async execute(interaction) {
    if (!interaction.inGuild() || !interaction.memberPermissions?.has(permission)) {
      return interaction.reply({ content: 'You do not have permission to use this command here.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply();
    const actor = await interaction.guild.members.fetch(interaction.user.id);
    const target = await interaction.guild.members.fetch(interaction.options.getUser('target', true).id).catch(() => null);
    if (!actor.permissions.has(permission) || !canModerate(actor, target, interaction.guild.ownerId, interaction.client.user.id)) {
      return interaction.editReply('You cannot moderate yourself, the bot, the server owner, or a member with an equal or higher role.');
    }
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (action === 'ban' || action === 'kick') {
      if (!target[action === 'ban' ? 'bannable' : 'kickable']) return interaction.editReply('My permissions or role position prevent this action.');
      if (action === 'ban') await target.ban({ reason });
      else await target.kick(reason);
    } else if (action === 'mute') {
      const duration = interaction.options.getInteger('duration');
      if (!Number.isInteger(duration) || duration < 1 || duration > 40320) return interaction.editReply('Duration must be between 1 and 40320 minutes.');
      if (!target.moderatable) return interaction.editReply('My permissions or role position prevent timing out this member.');
      await target.timeout(duration * 60000, reason);
    } else {
      // Keep a way to release members muted by the previous role-based implementation.
      const legacyRole = target.roles.cache.find(role => role.name === 'Muted');
      const timedOut = target.isCommunicationDisabled();
      if (!timedOut && !legacyRole) return interaction.editReply('That member is not muted.');
      if (timedOut && !target.moderatable) return interaction.editReply('I cannot remove this timeout.');
      const me = await interaction.guild.members.fetchMe();
      if (legacyRole && (!target.manageable || !legacyRole.editable || !me.permissions.has(PermissionsBitField.Flags.ManageRoles))) {
        return interaction.editReply('I need Manage Roles and a higher role to remove the old Muted role.');
      }
      if (legacyRole) await target.roles.remove(legacyRole, reason);
      if (timedOut) await target.timeout(null, reason);
    }
    const result = { ban: 'banned', kick: 'kicked', mute: 'timed out', unmute: 'unmuted' }[action];
    await interaction.editReply({ content: `${target.user.tag} has been ${result}.`, allowedMentions: { parse: [] } });
    await logAction(interaction.guild, action, target.user, interaction.user, reason);
  } };
}

module.exports = { canModerate, createModerationCommand };
