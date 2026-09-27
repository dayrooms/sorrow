const db = require('../database/db');

/**
 * Central interaction router for buttons/menus that persist across restarts
 * (giveaway entry, reaction-role buttons, ticket panel buttons, voicemaster).
 * Component-specific collectors (paginator) are handled inline elsewhere.
 */
module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      // ── Antinuke / Antiraid interactive configurators ──────
      // These handle select menus, buttons AND modal submits, so they must be
      // checked before the isButton()-only blocks below.
      if (interaction.customId?.startsWith('ancfg:')) {
        const { handleAntinuke } = require('../commands/antinuke/antinukeConfig');
        return handleAntinuke(client, interaction);
      }
      if (interaction.customId?.startsWith('arcfg:')) {
        const { handleAntiraid } = require('../commands/antinuke/antinukeConfig');
        return handleAntiraid(client, interaction);
      }

      if (interaction.isButton()) {
        // ── Giveaway entry ───────────────────────────────────
        if (interaction.customId === 'gw_enter') {
          const key = `giveaway:${interaction.message.id}`;
          const data = db.getSettings(interaction.guild.id, key, null);
          if (!data || data.ended) return interaction.reply({ content: 'This giveaway has ended.', ephemeral: true });
          data.entries = data.entries || [];
          if (data.entries.includes(interaction.user.id)) {
            data.entries = data.entries.filter((e) => e !== interaction.user.id);
            db.saveSettings(interaction.guild.id, key, data);
            return interaction.reply({ content: 'You left the giveaway.', ephemeral: true });
          }
          data.entries.push(interaction.user.id);
          db.saveSettings(interaction.guild.id, key, data);
          return interaction.reply({ content: `You entered! Total entries: ${data.entries.length}`, ephemeral: true });
        }

        // ── Reaction-role buttons (customId: rr_<roleId>) ────
        if (interaction.customId.startsWith('rr_')) {
          const roleId = interaction.customId.slice(3);
          const role = interaction.guild.roles.cache.get(roleId);
          if (!role) return interaction.reply({ content: 'That role no longer exists.', ephemeral: true });
          const member = interaction.member;
          if (member.roles.cache.has(roleId)) {
            await member.roles.remove(role).catch(() => {});
            return interaction.reply({ content: `Removed **${role.name}**.`, ephemeral: true });
          }
          await member.roles.add(role).catch(() => {});
          return interaction.reply({ content: `Added **${role.name}**.`, ephemeral: true });
        }

        // ── Ticket buttons ───────────────────────────────────
        if (interaction.customId.startsWith('ticket_')) {
          const tickets = require('../commands/tickets/tickets');
          if (tickets.handleButton) return tickets.handleButton(client, interaction);
        }

        // ── VoiceMaster interface buttons ────────────────────
        if (interaction.customId.startsWith('vm_')) {
          const vm = require('../commands/voice/voicemaster');
          if (vm.handleButton) return vm.handleButton(client, interaction);
        }
      }
    } catch (err) {
      client.logger.error(`Interaction error: ${err.message}`);
      if (interaction.isRepliable() && !interaction.replied) interaction.reply({ content: 'Something went wrong.', ephemeral: true }).catch(() => {});
    }
  },
};
