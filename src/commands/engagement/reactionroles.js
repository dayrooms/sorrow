const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveRole } = require('../../utils/resolve');
const db = require('../../database/db');

module.exports = new Command({
  name: 'reactionroles',
  aliases: ['rr', 'reactionrole'],
  category: 'engagement',
  description: 'Assign roles via buttons on a message.',
  permLevel: LEVELS.ADMIN,
  usage: 'panel <message text> | add <role> <label> | list',
  async run({ message, args, prefix, sub }) {
    switch (sub) {
      case 'panel': {
        // Create a new panel message with buttons built from following "add" calls,
        // or quick-create: rr panel <role1> <role2> ...
        const roles = [...message.mentions.roles.values()];
        if (!roles.length) return message.reply({ embeds: [error(`Mention one or more roles: \`${prefix}reactionroles panel @role1 @role2\``)] });
        const buttons = roles.slice(0, 5).map((r) => new ButtonBuilder().setCustomId(`rr_${r.id}`).setLabel(r.name).setStyle(ButtonStyle.Secondary));
        const row = new ActionRowBuilder().addComponents(buttons);
        const embed = base().setTitle('Role Menu').setDescription('Click a button to toggle a role:\n' + roles.map((r) => `• ${r}`).join('\n'));
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
        return;
      }
      case 'add': {
        return message.reply({ embeds: [base().setDescription(`Use \`${prefix}reactionroles panel @role1 @role2 ...\` to create a button role menu.`)] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Reaction Roles').setDescription(`\`${prefix}reactionroles panel @role1 @role2 ...\` — create a button role menu (up to 5 roles).`)] });
    }
  },
});
