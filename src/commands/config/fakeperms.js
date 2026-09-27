const Command = require('../../structures/Command');
const { LEVELS, FAKEPERM_MAP } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, resolveRole } = require('../../utils/resolve');
const db = require('../../database/db');

const VALID = Object.keys(FAKEPERM_MAP);

module.exports = new Command({
  name: 'fakeperms',
  aliases: ['fakepermissions', 'fp'],
  category: 'config',
  description: 'Grant bot-only permissions to roles/users without real Discord perms.',
  permLevel: LEVELS.GUILD_OWNER,
  usage: 'add/remove/list/reset/check/permissions <target> <perms>',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'fakeperms', { users: {}, roles: {} });

    switch (sub) {
      case 'permissions':
      case 'perms':
        return message.channel.send({ embeds: [base().setTitle('Valid fake permissions').setDescription(VALID.map((p) => `\`${p}\``).join(', '))] });

      case 'add': {
        const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
        const member = role ? null : (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        const id = role?.id || member?.id;
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}fakeperms add <role/user> <perm...>\``)] });
        const perms = args.slice(2).map((p) => p.toLowerCase().replace(/[^a-z]/g, '')).filter((p) => VALID.includes(p));
        if (!perms.length) return message.reply({ embeds: [error(`No valid perms. Options: ${VALID.join(', ')}`)] });
        const bucket = role ? 'roles' : 'users';
        data[bucket][id] = [...new Set([...(data[bucket][id] || []), ...perms])];
        db.saveSettings(message.guild.id, 'fakeperms', data);
        return message.reply({ embeds: [success(message.author, `Granted fake perms **${perms.join(', ')}** to ${role ? `**${role.name}**` : `<@${id}>`}.`)] });
      }

      case 'remove': {
        const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
        const member = role ? null : (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        const id = role?.id || member?.id;
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}fakeperms remove <role/user> <perm...>\``)] });
        const bucket = role ? 'roles' : 'users';
        const perms = args.slice(2).map((p) => p.toLowerCase().replace(/[^a-z]/g, ''));
        data[bucket][id] = (data[bucket][id] || []).filter((p) => !perms.includes(p));
        if (!data[bucket][id].length) delete data[bucket][id];
        db.saveSettings(message.guild.id, 'fakeperms', data);
        return message.reply({ embeds: [success(message.author, `Removed fake perms from ${role ? `**${role.name}**` : `<@${id}>`}.`)] });
      }

      case 'reset':
        db.saveSettings(message.guild.id, 'fakeperms', { users: {}, roles: {} });
        return message.reply({ embeds: [success(message.author, 'Reset all fake permissions.')] });

      case 'check':
      case 'list':
      default: {
        const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
        const member = role ? null : (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        if (role || member) {
          const id = role?.id || member?.id;
          const bucket = role ? 'roles' : 'users';
          const perms = data[bucket][id] || [];
          return message.channel.send({ embeds: [base().setTitle(`Fake perms — ${role ? role.name : member.user.tag}`).setDescription(perms.length ? perms.map((p) => `\`${p}\``).join(', ') : 'none')] });
        }
        const lines = [];
        for (const [rid, perms] of Object.entries(data.roles)) lines.push(`<@&${rid}>: ${perms.join(', ')}`);
        for (const [uid, perms] of Object.entries(data.users)) lines.push(`<@${uid}>: ${perms.join(', ')}`);
        return message.channel.send({ embeds: [base().setTitle('Fake permissions').setDescription(lines.join('\n') || 'None configured.')] });
      }
    }
  },
});
