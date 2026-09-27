const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveRole, resolveChannel, parseDuration } = require('../../utils/resolve');
const db = require('../../database/db');

const settings = new Command({
  name: 'settings',
  aliases: ['config', 'serversettings'],
  category: 'config',
  description: 'Configure core server settings (mute/jail roles, log/jail channels, defaults).',
  permLevel: LEVELS.ADMIN,
  usage: 'roles/channels/default ...',
  help: {
    title: 'Core server settings',
    intro: 'Configure the roles and channels Sorrow uses for moderation. Run `;settings` alone to see the current overview.',
    subcommands: [
      { usage: 'roles mute <role>', desc: 'Set the mute role. `settings roles jail <role>` sets the jail role.' },
      { usage: 'channels modlog <#channel>', desc: 'Set the mod-log channel. `settings channels jail <#channel>` sets the jail channel.' },
      { usage: 'default banpurge <0-7>', desc: 'Default days of messages to delete when banning.' },
    ],
  },
  async run({ message, args, prefix, sub }) {
    const s = db.getSettings(message.guild.id, 'settings', {});

    if (sub === 'roles') {
      const which = (args[1] || '').toLowerCase(); // mute|jail
      const role = resolveRole(message.guild, args.slice(2).join(' ')) || message.mentions.roles?.first();
      if (!which || !role) return message.reply({ embeds: [error(`Usage: \`${prefix}settings roles <mute|jail> <role>\``)] });
      if (which === 'mute') s.muteRole = role.id;
      else if (which === 'jail') s.jailRole = role.id;
      else return message.reply({ embeds: [error('Options: mute, jail')] });
      db.saveSettings(message.guild.id, 'settings', s);
      return message.reply({ embeds: [success(message.author, `Set ${which} role to **${role.name}**.`)] });
    }

    if (sub === 'channels') {
      const which = (args[1] || '').toLowerCase(); // modlog|jail
      const ch = resolveChannel(message.guild, args[2]) || message.mentions.channels?.first();
      if (!which || !ch) return message.reply({ embeds: [error(`Usage: \`${prefix}settings channels <modlog|jail> <#channel>\``)] });
      if (which === 'modlog') s.modLog = ch.id;
      else if (which === 'jail') s.jailChannel = ch.id;
      else return message.reply({ embeds: [error('Options: modlog, jail')] });
      db.saveSettings(message.guild.id, 'settings', s);
      return message.reply({ embeds: [success(message.author, `Set ${which} channel to ${ch}.`)] });
    }

    if (sub === 'default') {
      const key = (args[1] || '').toLowerCase(); // banpurge
      if (key === 'banpurge') {
        const days = Math.min(7, parseInt(args[2], 10) || 0);
        s.banPurgeDays = days;
        db.saveSettings(message.guild.id, 'settings', s);
        return message.reply({ embeds: [success(message.author, `Default ban message-purge set to **${days}** day(s).`)] });
      }
      return message.reply({ embeds: [error(`Usage: \`${prefix}settings default banpurge <0-7>\``)] });
    }

    // Overview
    const e = base()
      .setTitle('Server settings')
      .setDescription(
        [
          `**Mute role:** ${s.muteRole ? `<@&${s.muteRole}>` : 'not set'}`,
          `**Jail role:** ${s.jailRole ? `<@&${s.jailRole}>` : 'not set'}`,
          `**Mod-log channel:** ${s.modLog ? `<#${s.modLog}>` : 'not set'}`,
          `**Jail channel:** ${s.jailChannel ? `<#${s.jailChannel}>` : 'not set'}`,
          `**Ban purge days:** ${s.banPurgeDays ?? 0}`,
          '',
          `Configure: \`${prefix}settings roles/channels/default ...\``,
        ].join('\n')
      );
    return message.channel.send({ embeds: [e] });
  },
});

const warnpunish = new Command({
  name: 'warnpunish',
  category: 'config',
  description: 'Configure auto-punishments at warn thresholds.',
  permLevel: LEVELS.ADMIN,
  usage: '<count> <kick|ban|timeout:duration|clear>',
  async run({ message, args, prefix }) {
    const count = parseInt(args[0], 10);
    const action = (args[1] || '').toLowerCase();
    if (Number.isNaN(count)) {
      const data = db.getSettings(message.guild.id, 'warnpunish', {});
      const lines = Object.entries(data).map(([c, a]) => `**${c} warns** → ${a}`);
      return message.channel.send({ embeds: [base().setTitle('Warn punishments').setDescription(lines.join('\n') || `None. Set with \`${prefix}warnpunish <count> <action>\``)] });
    }
    const data = db.getSettings(message.guild.id, 'warnpunish', {});
    if (action === 'clear' || action === 'remove') { delete data[String(count)]; }
    else if (['kick', 'ban'].includes(action) || (action.startsWith('timeout:') && parseDuration(action.split(':')[1]))) { data[String(count)] = action; }
    else return message.reply({ embeds: [error('Action must be `kick`, `ban`, `timeout:<duration>`, or `clear`.')] });
    db.saveSettings(message.guild.id, 'warnpunish', data);
    return message.reply({ embeds: [success(message.author, `Set warn punishment at **${count}** warns → **${action}**.`)] });
  },
});

module.exports = [settings, warnpunish];
