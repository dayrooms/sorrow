const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember } = require('../../utils/resolve');
const db = require('../../database/db');

/** Runtime map of temp channel -> owner id, persisted in settings too. */

const command = new Command({
  name: 'voicemaster',
  aliases: ['vm', 'voice'],
  category: 'voice',
  description: 'Temporary voice channels.',
  permLevel: LEVELS.USER,
  usage: 'setup | config | reset | (owner) lock/unlock/ghost/name/limit/permit/reject/claim/transfer/kick',
  async run({ client, message, args, prefix, sub }) {
    const adminSubs = ['setup', 'config', 'reset', 'sendinterface'];
    if (adminSubs.includes(sub)) {
      const { check } = require('../../utils/permissions');
      if (!check(message.member, LEVELS.ADMIN, message.guild.id).ok) return message.reply({ embeds: [error('Manage Server required.')] });

      const cfg = db.getSettings(message.guild.id, 'voicemaster', { category: null, joinChannel: null, interface: null, temps: {} });
      if (sub === 'setup') {
        const category = await message.guild.channels.create({ name: 'Voice Channels', type: ChannelType.GuildCategory }).catch(() => null);
        const join = await message.guild.channels.create({ name: '➕ Join to Create', type: ChannelType.GuildVoice, parent: category?.id }).catch(() => null);
        const iface = await message.guild.channels.create({ name: 'interface', type: ChannelType.GuildText, parent: category?.id }).catch(() => null);
        if (!join) return message.reply({ embeds: [error('Setup failed — check my permissions.')] });
        cfg.category = category?.id;
        cfg.joinChannel = join.id;
        cfg.interface = iface?.id;
        db.saveSettings(message.guild.id, 'voicemaster', cfg);
        if (iface) await iface.send({ embeds: [interfaceEmbed()], components: interfaceRows() }).catch(() => {});
        return message.reply({ embeds: [success(message.author, `VoiceMaster ready. Join ${join} to create your own channel.`)] });
      }
      if (sub === 'config') return message.channel.send({ embeds: [base().setTitle('VoiceMaster').setDescription(`**Join channel:** ${cfg.joinChannel ? `<#${cfg.joinChannel}>` : 'none'}\n**Interface:** ${cfg.interface ? `<#${cfg.interface}>` : 'none'}`)] });
      if (sub === 'reset') {
        for (const id of Object.keys(cfg.temps || {})) { const c = message.guild.channels.cache.get(id); await c?.delete().catch(() => {}); }
        if (cfg.joinChannel) await message.guild.channels.cache.get(cfg.joinChannel)?.delete().catch(() => {});
        if (cfg.interface) await message.guild.channels.cache.get(cfg.interface)?.delete().catch(() => {});
        if (cfg.category) await message.guild.channels.cache.get(cfg.category)?.delete().catch(() => {});
        db.clearSettings(message.guild.id, 'voicemaster');
        return message.reply({ embeds: [success(message.author, 'VoiceMaster removed.')] });
      }
      if (sub === 'sendinterface') { const iface = message.channel; await iface.send({ embeds: [interfaceEmbed()], components: interfaceRows() }); return; }
    }

    // Owner controls (text-command versions)
    const cfg = db.getSettings(message.guild.id, 'voicemaster', { temps: {} });
    const vc = message.member.voice?.channel;
    if (!vc || !cfg.temps?.[vc.id]) return message.reply({ embeds: [error('You must be in your own VoiceMaster channel.')] });
    if (cfg.temps[vc.id] !== message.author.id && !sub?.startsWith('claim')) return message.reply({ embeds: [error('You are not the owner of this channel.')] });

    switch (sub) {
      case 'lock': await vc.permissionOverwrites.edit(message.guild.id, { Connect: false }).catch(() => {}); return message.reply({ embeds: [success(message.author, '🔒 Locked your channel.')] });
      case 'unlock': await vc.permissionOverwrites.edit(message.guild.id, { Connect: null }).catch(() => {}); return message.reply({ embeds: [success(message.author, '🔓 Unlocked your channel.')] });
      case 'ghost': await vc.permissionOverwrites.edit(message.guild.id, { ViewChannel: false }).catch(() => {}); return message.reply({ embeds: [success(message.author, '👻 Hid your channel.')] });
      case 'unghost': await vc.permissionOverwrites.edit(message.guild.id, { ViewChannel: null }).catch(() => {}); return message.reply({ embeds: [success(message.author, '👁️ Revealed your channel.')] });
      case 'name': { const n = args.slice(1).join(' '); if (!n) return message.reply({ embeds: [error('Provide a name.')] }); await vc.setName(n).catch(() => {}); return message.reply({ embeds: [success(message.author, `Renamed to **${n}**.`)] }); }
      case 'limit': { const l = Math.min(99, Math.max(0, parseInt(args[1], 10) || 0)); await vc.setUserLimit(l).catch(() => {}); return message.reply({ embeds: [success(message.author, `User limit set to **${l || 'unlimited'}**.`)] }); }
      case 'permit': { const m = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first(); if (!m) return message.reply({ embeds: [error('Member not found.')] }); await vc.permissionOverwrites.edit(m.id, { Connect: true, ViewChannel: true }).catch(() => {}); return message.reply({ embeds: [success(message.author, `Permitted **${m.user.tag}**.`)] }); }
      case 'reject': case 'kick': { const m = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first(); if (!m) return message.reply({ embeds: [error('Member not found.')] }); await vc.permissionOverwrites.edit(m.id, { Connect: false }).catch(() => {}); if (m.voice?.channelId === vc.id) await m.voice.disconnect().catch(() => {}); return message.reply({ embeds: [success(message.author, `Rejected **${m.user.tag}**.`)] }); }
      case 'claim': { if (cfg.temps[vc.id] && vc.members.has(cfg.temps[vc.id])) return message.reply({ embeds: [error('The owner is still here.')] }); cfg.temps[vc.id] = message.author.id; db.saveSettings(message.guild.id, 'voicemaster', cfg); return message.reply({ embeds: [success(message.author, 'You now own this channel.')] }); }
      case 'transfer': { const m = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first(); if (!m || m.voice?.channelId !== vc.id) return message.reply({ embeds: [error('That member must be in your channel.')] }); cfg.temps[vc.id] = m.id; db.saveSettings(message.guild.id, 'voicemaster', cfg); return message.reply({ embeds: [success(message.author, `Transferred ownership to **${m.user.tag}**.`)] }); }
      case 'info': return message.channel.send({ embeds: [base().setTitle(vc.name).setDescription(`**Owner:** <@${cfg.temps[vc.id]}>\n**Members:** ${vc.members.size}\n**Limit:** ${vc.userLimit || 'none'}\n**Bitrate:** ${vc.bitrate / 1000}kbps`)] });
      default:
        return message.channel.send({ embeds: [base().setTitle('VoiceMaster').setDescription(`Admin: \`${prefix}vm setup/config/reset\`\nOwner: \`${prefix}vm lock/unlock/ghost/name/limit/permit/reject/claim/transfer/info\``)] });
    }
  },
});

function interfaceEmbed() {
  return base().setTitle('VoiceMaster Interface').setDescription('Control your temporary voice channel with the buttons below.');
}
function interfaceRows() {
  const b = (id, emoji, label) => new ButtonBuilder().setCustomId(id).setEmoji(emoji).setStyle(ButtonStyle.Secondary).setLabel(label);
  return [
    new ActionRowBuilder().addComponents(b('vm_lock', '🔒', 'Lock'), b('vm_unlock', '🔓', 'Unlock'), b('vm_ghost', '👻', 'Hide'), b('vm_unghost', '👁️', 'Reveal'), b('vm_claim', '👑', 'Claim')),
    new ActionRowBuilder().addComponents(b('vm_rename', '✏️', 'Rename'), b('vm_limit', '🔢', 'Limit'), b('vm_info', 'ℹ️', 'Info')),
  ];
}

/** Button handler (called from interactionCreate). */
async function handleButton(client, interaction) {
  const cfg = db.getSettings(interaction.guild.id, 'voicemaster', { temps: {} });
  const vc = interaction.member.voice?.channel;
  if (!vc || !cfg.temps?.[vc.id]) return interaction.reply({ content: 'Join your own VoiceMaster channel first.', ephemeral: true });
  const isOwner = cfg.temps[vc.id] === interaction.user.id;
  const id = interaction.customId;
  if (id === 'vm_claim') {
    if (vc.members.has(cfg.temps[vc.id])) return interaction.reply({ content: 'The owner is still here.', ephemeral: true });
    cfg.temps[vc.id] = interaction.user.id; db.saveSettings(interaction.guild.id, 'voicemaster', cfg);
    return interaction.reply({ content: 'You now own this channel.', ephemeral: true });
  }
  if (!isOwner) return interaction.reply({ content: 'You are not the owner of this channel.', ephemeral: true });
  switch (id) {
    case 'vm_lock': await vc.permissionOverwrites.edit(interaction.guild.id, { Connect: false }).catch(() => {}); return interaction.reply({ content: '🔒 Locked.', ephemeral: true });
    case 'vm_unlock': await vc.permissionOverwrites.edit(interaction.guild.id, { Connect: null }).catch(() => {}); return interaction.reply({ content: '🔓 Unlocked.', ephemeral: true });
    case 'vm_ghost': await vc.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false }).catch(() => {}); return interaction.reply({ content: '👻 Hidden.', ephemeral: true });
    case 'vm_unghost': await vc.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: null }).catch(() => {}); return interaction.reply({ content: '👁️ Revealed.', ephemeral: true });
    case 'vm_info': return interaction.reply({ embeds: [base().setTitle(vc.name).setDescription(`Owner: <@${cfg.temps[vc.id]}>\nMembers: ${vc.members.size}`)], ephemeral: true });
    default: return interaction.reply({ content: 'Use the text command for that action (e.g. `;vm rename <name>`).', ephemeral: true });
  }
}

module.exports = command;
module.exports.handleButton = handleButton;
