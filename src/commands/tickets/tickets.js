const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel } = require('../../utils/resolve');
const db = require('../../database/db');

const command = new Command({
  name: 'tickets',
  aliases: ['ticket'],
  category: 'tickets',
  description: 'Support ticket system.',
  permLevel: LEVELS.USER,
  usage: 'setup | panel | close | claim | add/remove <user>',
  help: {
    title: 'Support ticket system',
    intro: 'Button-based support tickets. An admin runs setup to post a panel; members click to open a private ticket channel. Staff can claim, add/remove people, and close.',
    subcommands: [
      { usage: 'setup', desc: 'Admin: create the ticket category and post the "Open a Ticket" panel here.' },
      { usage: 'staffroles @role', desc: 'Admin: add a role as ticket staff (pinged on open, can see tickets).' },
      { usage: 'reset', desc: 'Admin: wipe the ticket system.' },
      { usage: 'close', desc: 'Close the current ticket (deletes it after 5s).' },
      { usage: 'claim', desc: 'Claim the current ticket as the handling staff.' },
      { usage: 'add <user>', desc: 'Add a user to the current ticket.' },
      { usage: 'remove <user>', desc: 'Remove a user from the current ticket.' },
    ],
  },
  async run({ client, message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'tickets', { category: null, staffRoles: [], panelChannel: null, count: 0, open: {} });

    const adminSubs = ['setup', 'panel', 'panels', 'staffroles', 'reset', 'resend'];
    if (adminSubs.includes(sub)) {
      const { check } = require('../../utils/permissions');
      if (!check(message.member, LEVELS.ADMIN, message.guild.id).ok) return message.reply({ embeds: [error('Administrator required.')] });

      if (sub === 'setup' || sub === 'panel') {
        let category = cfg.category ? message.guild.channels.cache.get(cfg.category) : null;
        if (!category) category = await message.guild.channels.create({ name: 'Tickets', type: ChannelType.GuildCategory }).catch(() => null);
        cfg.category = category?.id;
        cfg.panelChannel = message.channel.id;
        db.saveSettings(message.guild.id, 'tickets', cfg);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_open').setEmoji('🎫').setLabel('Open a Ticket').setStyle(ButtonStyle.Primary));
        await message.channel.send({ embeds: [base().setTitle('🎫 Support').setDescription('Click the button below to open a support ticket.')], components: [row] });
        return message.delete().catch(() => {});
      }
      if (sub === 'staffroles') {
        const role = message.mentions.roles?.first();
        if (role) { if (!cfg.staffRoles.includes(role.id)) cfg.staffRoles.push(role.id); db.saveSettings(message.guild.id, 'tickets', cfg); return message.reply({ embeds: [success(message.author, `Added **${role.name}** as ticket staff.`)] }); }
        return message.channel.send({ embeds: [base().setTitle('Ticket staff roles').setDescription(cfg.staffRoles.map((r) => `<@&${r}>`).join(' ') || 'none')] });
      }
      if (sub === 'reset') { db.clearSettings(message.guild.id, 'tickets'); return message.reply({ embeds: [success(message.author, 'Ticket system reset.')] }); }
    }

    // In-ticket actions
    const ticketData = cfg.open?.[message.channel.id];
    switch (sub) {
      case 'close': {
        if (!ticketData) return message.reply({ embeds: [error('This is not a ticket channel.')] });
        await message.channel.send({ embeds: [base().setDescription('🔒 Closing ticket in 5 seconds...')] });
        delete cfg.open[message.channel.id];
        db.saveSettings(message.guild.id, 'tickets', cfg);
        setTimeout(() => message.channel.delete().catch(() => {}), 5000);
        return;
      }
      case 'claim': {
        if (!ticketData) return message.reply({ embeds: [error('This is not a ticket channel.')] });
        ticketData.claimedBy = message.author.id;
        db.saveSettings(message.guild.id, 'tickets', cfg);
        return message.reply({ embeds: [success(message.author, `Claimed by <@${message.author.id}>.`)] });
      }
      case 'add': case 'allow': {
        if (!ticketData) return message.reply({ embeds: [error('This is not a ticket channel.')] });
        const u = message.mentions.users.first();
        if (u) await message.channel.permissionOverwrites.edit(u.id, { ViewChannel: true, SendMessages: true }).catch(() => {});
        return message.reply({ embeds: [success(message.author, `Added <@${u?.id}> to the ticket.`)] });
      }
      case 'remove': case 'deny': {
        if (!ticketData) return message.reply({ embeds: [error('This is not a ticket channel.')] });
        const u = message.mentions.users.first();
        if (u) await message.channel.permissionOverwrites.edit(u.id, { ViewChannel: false }).catch(() => {});
        return message.reply({ embeds: [success(message.author, `Removed <@${u?.id}> from the ticket.`)] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Tickets').setDescription(`Admin: \`${prefix}tickets setup\` · \`staffroles @role\`\nIn-ticket: \`${prefix}tickets close/claim/add/remove\``)] });
    }
  },
});

/** Button handler for the ticket panel (from interactionCreate). */
async function handleButton(client, interaction) {
  if (interaction.customId !== 'ticket_open') return;
  const cfg = db.getSettings(interaction.guild.id, 'tickets', { category: null, staffRoles: [], count: 0, open: {} });

  // one ticket per user
  const existing = Object.entries(cfg.open || {}).find(([, t]) => t.user === interaction.user.id);
  if (existing) return interaction.reply({ content: `You already have an open ticket: <#${existing[0]}>`, ephemeral: true });

  cfg.count = (cfg.count || 0) + 1;
  const overwrites = [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ...cfg.staffRoles.map((r) => ({ id: r, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })),
  ];
  const ch = await interaction.guild.channels.create({
    name: `ticket-${cfg.count}`,
    type: ChannelType.GuildText,
    parent: cfg.category || undefined,
    permissionOverwrites: overwrites,
  }).catch(() => null);
  if (!ch) return interaction.reply({ content: 'Failed to create ticket (check my permissions).', ephemeral: true });

  cfg.open[ch.id] = { user: interaction.user.id, claimedBy: null, num: cfg.count };
  db.saveSettings(interaction.guild.id, 'tickets', cfg);

  const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close_btn').setEmoji('🔒').setLabel('Close').setStyle(ButtonStyle.Danger));
  await ch.send({ content: `<@${interaction.user.id}> ${cfg.staffRoles.map((r) => `<@&${r}>`).join(' ')}`, embeds: [base().setTitle(`Ticket #${cfg.count}`).setDescription('Support will be with you shortly. Describe your issue.')], components: [closeRow] }).catch(() => {});
  return interaction.reply({ content: `Ticket opened: ${ch}`, ephemeral: true });
}

module.exports = command;
module.exports.handleButton = async (client, interaction) => {
  if (interaction.customId === 'ticket_open') return handleButton(client, interaction);
  if (interaction.customId === 'ticket_close_btn') {
    const cfg = db.getSettings(interaction.guild.id, 'tickets', { open: {} });
    if (!cfg.open?.[interaction.channel.id]) return interaction.reply({ content: 'Not a ticket.', ephemeral: true });
    await interaction.reply({ embeds: [base().setDescription('🔒 Closing in 5s...')] });
    delete cfg.open[interaction.channel.id];
    db.saveSettings(interaction.guild.id, 'tickets', cfg);
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
};
