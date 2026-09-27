const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveRole } = require('../../utils/resolve');
const db = require('../../database/db');

module.exports = new Command({
  name: 'autorole',
  category: 'config',
  description: 'Automatically assign roles to new members (humans and bots).',
  permLevel: LEVELS.ADMIN,
  usage: 'add/remove/list/reset <role> [bots]',
  help: {
    title: 'Autorole',
    intro: 'Automatically give roles to members when they join. Separate lists for humans and bots.',
    subcommands: [
      { usage: 'add <role> [bots]', desc: 'Add an autorole. Add the word `bots` to make it bot-only.' },
      { usage: 'remove <role>', desc: 'Remove an autorole.' },
      { usage: 'list', desc: 'Show all autoroles.' },
      { usage: 'reset', desc: 'Clear all autoroles.' },
    ],
  },
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'autorole', { humans: [], bots: [] });

    switch (sub) {
      case 'add': {
        const forBots = args.includes('bots') || args.includes('bot');
        const role = resolveRole(message.guild, args.slice(1).filter((a) => !['bots', 'bot'].includes(a.toLowerCase())).join(' ')) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}autorole add <role> [bots]\``)] });
        if (role.position >= message.guild.members.me.roles.highest.position) return message.reply({ embeds: [error('That role is above mine.')] });
        const bucket = forBots ? 'bots' : 'humans';
        if (!data[bucket].includes(role.id)) data[bucket].push(role.id);
        db.saveSettings(message.guild.id, 'autorole', data);
        return message.reply({ embeds: [success(message.author, `Added **${role.name}** as an autorole for **${bucket}**.`)] });
      }
      case 'remove': {
        const role = resolveRole(message.guild, args.slice(1).join(' ')) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}autorole remove <role>\``)] });
        data.humans = data.humans.filter((r) => r !== role.id);
        data.bots = data.bots.filter((r) => r !== role.id);
        db.saveSettings(message.guild.id, 'autorole', data);
        return message.reply({ embeds: [success(message.author, `Removed **${role.name}** from autoroles.`)] });
      }
      case 'reset':
        db.saveSettings(message.guild.id, 'autorole', { humans: [], bots: [] });
        return message.reply({ embeds: [success(message.author, 'Cleared all autoroles.')] });
      default:
        return message.channel.send({
          embeds: [base().setTitle('Autoroles').setDescription(`**Humans:** ${data.humans.map((r) => `<@&${r}>`).join(' ') || 'none'}\n**Bots:** ${data.bots.map((r) => `<@&${r}>`).join(' ') || 'none'}`)],
        });
    }
  },
});
