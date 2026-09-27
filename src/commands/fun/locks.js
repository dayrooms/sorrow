const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember } = require('../../utils/resolve');
const db = require('../../database/db');

function lockCommand(name, key, label) {
  return new Command({
    name, category: 'fun', description: `Manage ${label} for users.`, permLevel: LEVELS.MOD, usage: 'add/remove/list/reset <member>',
    botPerms: [PermissionFlagsBits.ManageWebhooks, PermissionFlagsBits.ManageMessages],
    async run({ message, args, prefix, sub }) {
      const data = db.getSettings(message.guild.id, 'textlocks', { uwu: [], gay: [] });
      const bucket = data[key] || [];
      const target = (await resolveMember(message.guild, args[1]))?.user || message.mentions.users.first();
      switch (sub) {
        case 'add':
          if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}${name} add <member>\``)] });
          if (!bucket.includes(target.id)) bucket.push(target.id);
          data[key] = bucket; db.saveSettings(message.guild.id, 'textlocks', data);
          return message.reply({ embeds: [success(message.author, `**${target.username}** is now ${label}ed. 😈`)] });
        case 'remove':
          if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}${name} remove <member>\``)] });
          data[key] = bucket.filter((id) => id !== target.id); db.saveSettings(message.guild.id, 'textlocks', data);
          return message.reply({ embeds: [success(message.author, `Removed ${label} from **${target.username}**.`)] });
        case 'reset':
          data[key] = []; db.saveSettings(message.guild.id, 'textlocks', data);
          return message.reply({ embeds: [success(message.author, `Cleared all ${label}s.`)] });
        default:
          return message.channel.send({ embeds: [base().setTitle(`${label}ed users`).setDescription(bucket.map((id) => `<@${id}>`).join('\n') || 'None.')] });
      }
    },
  });
}

const uwulock = lockCommand('uwulock', 'uwu', 'uwulock');
const gaylock = lockCommand('gaylock', 'gay', 'gaylock');

// Shortcuts
const uwunlock = new Command({ name: 'uwunlock', category: 'fun', description: 'Remove uwulock.', permLevel: LEVELS.MOD, usage: '<member>', async run(ctx) { ctx.args = ['remove', ...ctx.args]; ctx.sub = 'remove'; return uwulock.run(ctx); } });
const gayunlock = new Command({ name: 'gayunlock', category: 'fun', description: 'Remove gaylock.', permLevel: LEVELS.MOD, usage: '<member>', async run(ctx) { ctx.args = ['remove', ...ctx.args]; ctx.sub = 'remove'; return gaylock.run(ctx); } });

module.exports = [uwulock, gaylock, uwunlock, gayunlock];
