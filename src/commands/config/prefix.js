const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const db = require('../../database/db');
const config = require('../../config');

const prefix = new Command({
  name: 'prefix',
  category: 'config',
  description: 'View or manage the server prefix.',
  permLevel: LEVELS.USER,
  usage: '[set <prefix> | reset]',
  async run({ message, args, prefix: current, sub }) {
    if (sub === 'set') {
      // Requires Manage Guild
      const { check } = require('../../utils/permissions');
      if (!check(message.member, LEVELS.ADMIN, message.guild.id).ok) return message.reply({ embeds: [error('You need **Manage Server** to change the prefix.')] });
      const p = args[1];
      if (!p || p.length > 5) return message.reply({ embeds: [error('Provide a prefix (max 5 chars).')] });
      db.setPrefix(message.guild.id, p);
      return message.reply({ embeds: [success(message.author, `Server prefix set to \`${p}\``)] });
    }
    if (sub === 'reset') {
      const { check } = require('../../utils/permissions');
      if (!check(message.member, LEVELS.ADMIN, message.guild.id).ok) return message.reply({ embeds: [error('You need **Manage Server** to reset the prefix.')] });
      db.setPrefix(message.guild.id, config.defaultPrefix);
      return message.reply({ embeds: [success(message.author, `Prefix reset to \`${config.defaultPrefix}\``)] });
    }
    return message.reply({ embeds: [base().setDescription(`My prefix here is \`${current}\`. Use \`${current}prefix set <prefix>\` to change it.`)] });
  },
});

const alias = new Command({
  name: 'alias',
  category: 'config',
  description: 'Create custom command shortcuts.',
  permLevel: LEVELS.ADMIN,
  usage: 'add/remove/list <alias> <command>',
  async run({ message, args, prefix: p, sub }) {
    const aliases = db.getSettings(message.guild.id, 'aliases', {});
    if (sub === 'add') {
      const name = args[1]?.toLowerCase();
      const target = args.slice(2).join(' ');
      if (!name || !target) return message.reply({ embeds: [error(`Usage: \`${p}alias add <alias> <command>\``)] });
      aliases[name] = target;
      db.saveSettings(message.guild.id, 'aliases', aliases);
      return message.reply({ embeds: [success(message.author, `Alias \`${name}\` → \`${target}\``)] });
    }
    if (sub === 'remove') {
      const name = args[1]?.toLowerCase();
      delete aliases[name];
      db.saveSettings(message.guild.id, 'aliases', aliases);
      return message.reply({ embeds: [success(message.author, `Removed alias \`${name}\`.`)] });
    }
    const list = Object.entries(aliases).map(([k, v]) => `\`${k}\` → \`${v}\``);
    return message.channel.send({ embeds: [base().setTitle('Aliases').setDescription(list.join('\n') || 'None.')] });
  },
});

// ignore / suppress / restrict / disablecommand share the same shape
function toggleListCmd(name, moduleKey, level, label) {
  return new Command({
    name,
    category: 'config',
    description: `Manage ${label}.`,
    permLevel: level,
    usage: 'add/remove/list <...>',
    async run({ message, args, prefix: p, sub }) {
      if (name === 'ignore') {
        const data = db.getSettings(message.guild.id, 'ignore', { users: [], roles: [], channels: [] });
        const { resolveMember, resolveRole, resolveChannel } = require('../../utils/resolve');
        if (sub === 'add' || sub === 'remove') {
          const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
          const ch = role ? null : resolveChannel(message.guild, args[1]) || message.mentions.channels?.first();
          const member = role || ch ? null : (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
          const id = role?.id || ch?.id || member?.id;
          const bucket = role ? 'roles' : ch ? 'channels' : 'users';
          if (!id) return message.reply({ embeds: [error(`Usage: \`${p}ignore ${sub} <user/role/channel>\``)] });
          if (sub === 'add') { if (!data[bucket].includes(id)) data[bucket].push(id); }
          else data[bucket] = data[bucket].filter((x) => x !== id);
          db.saveSettings(message.guild.id, 'ignore', data);
          return message.reply({ embeds: [success(message.author, `${sub === 'add' ? 'Now ignoring' : 'No longer ignoring'} that ${bucket.slice(0, -1)}.`)] });
        }
        return message.channel.send({ embeds: [base().setTitle('Ignored').setDescription(`Users: ${data.users.map((i) => `<@${i}>`).join(' ') || 'none'}\nRoles: ${data.roles.map((i) => `<@&${i}>`).join(' ') || 'none'}\nChannels: ${data.channels.map((i) => `<#${i}>`).join(' ') || 'none'}`)] });
      }

      if (name === 'restrict') {
        const data = db.getSettings(message.guild.id, 'restrict', {});
        const { resolveRole } = require('../../utils/resolve');
        if (sub === 'add') {
          const cmd = args[1]?.toLowerCase();
          const role = resolveRole(message.guild, args.slice(2).join(' ')) || message.mentions.roles?.first();
          if (!cmd || !role) return message.reply({ embeds: [error(`Usage: \`${p}restrict add <command> <role>\``)] });
          data[cmd] = [...new Set([...(data[cmd] || []), role.id])];
          db.saveSettings(message.guild.id, 'restrict', data);
          return message.reply({ embeds: [success(message.author, `\`${cmd}\` restricted to **${role.name}**.`)] });
        }
        if (sub === 'remove') {
          const cmd = args[1]?.toLowerCase();
          delete data[cmd];
          db.saveSettings(message.guild.id, 'restrict', data);
          return message.reply({ embeds: [success(message.author, `Removed restriction on \`${cmd}\`.`)] });
        }
        if (sub === 'reset') { db.saveSettings(message.guild.id, 'restrict', {}); return message.reply({ embeds: [success(message.author, 'Cleared restrictions.')] }); }
        return message.channel.send({ embeds: [base().setTitle('Restricted commands').setDescription(Object.entries(data).map(([c, r]) => `\`${c}\`: ${r.map((x) => `<@&${x}>`).join(' ')}`).join('\n') || 'None.')] });
      }

      if (name === 'suppress') {
        const data = db.getSettings(message.guild.id, 'suppress', {});
        const { resolveChannel } = require('../../utils/resolve');
        if (sub === 'add') {
          const cmd = args[1]?.toLowerCase();
          const ch = resolveChannel(message.guild, args[2]) || message.mentions.channels?.first();
          const scope = ch ? ch.id : 'all';
          if (!cmd) return message.reply({ embeds: [error(`Usage: \`${p}suppress add <command> [#channel|all]\``)] });
          data[cmd] = [...new Set([...(data[cmd] || []), scope])];
          db.saveSettings(message.guild.id, 'suppress', data);
          return message.reply({ embeds: [success(message.author, `Suppressed \`${cmd}\` in ${scope === 'all' ? 'all channels' : `<#${scope}>`}.`)] });
        }
        if (sub === 'remove') { const cmd = args[1]?.toLowerCase(); delete data[cmd]; db.saveSettings(message.guild.id, 'suppress', data); return message.reply({ embeds: [success(message.author, `Unsuppressed \`${cmd}\`.`)] }); }
        if (sub === 'reset') { db.saveSettings(message.guild.id, 'suppress', {}); return message.reply({ embeds: [success(message.author, 'Cleared suppressions.')] }); }
        return message.channel.send({ embeds: [base().setTitle('Suppressed').setDescription(Object.entries(data).map(([c, s]) => `\`${c}\`: ${s.join(', ')}`).join('\n') || 'None.')] });
      }

      // disablecommand / enablecommand
      if (name === 'disablecommand' || name === 'enablecommand') {
        const data = db.getSettings(message.guild.id, 'disabled', { commands: [] });
        const cmd = args[0]?.toLowerCase();
        if (!cmd) return message.reply({ embeds: [error(`Usage: \`${p}${name} <command>\``)] });
        if (name === 'disablecommand') { if (!data.commands.includes(cmd)) data.commands.push(cmd); }
        else data.commands = data.commands.filter((c) => c !== cmd);
        db.saveSettings(message.guild.id, 'disabled', data);
        return message.reply({ embeds: [success(message.author, `\`${cmd}\` is now **${name === 'disablecommand' ? 'disabled' : 'enabled'}**.`)] });
      }
    },
  });
}

const ignore = toggleListCmd('ignore', 'ignore', LEVELS.ADMIN, 'ignored users/roles/channels');
const restrict = toggleListCmd('restrict', 'restrict', LEVELS.ADMIN, 'command role restrictions');
const suppress = toggleListCmd('suppress', 'suppress', LEVELS.MOD, 'command suppression');
const disablecommand = toggleListCmd('disablecommand', 'disabled', LEVELS.ADMIN, 'disabled commands');
const enablecommand = toggleListCmd('enablecommand', 'disabled', LEVELS.ADMIN, 'enabled commands');

module.exports = [prefix, alias, ignore, restrict, suppress, disablecommand, enablecommand];
