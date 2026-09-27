const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel, resolveMember, resolveUser } = require('../../utils/resolve');
const db = require('../../database/db');
const { paginate, chunk } = require('../../utils/paginate');

/** birthday — stored per-user in settings birthday:<uid> (global-ish per guild). */
const birthday = new Command({
  name: 'birthday',
  aliases: ['bday'],
  category: 'engagement',
  description: 'Set and view birthdays.',
  permLevel: LEVELS.USER,
  usage: 'set <MM/DD> | view [member] | list | setup',
  async run({ client, message, args, prefix, sub }) {
    if (sub === 'set') {
      const date = args[1];
      if (!/^\d{1,2}\/\d{1,2}$/.test(date || '')) return message.reply({ embeds: [error(`Usage: \`${prefix}birthday set MM/DD\``)] });
      db.saveSettings(message.guild.id, `bday:${message.author.id}`, { date });
      return message.reply({ embeds: [success(message.author, `Birthday set to **${date}**.`)] });
    }
    if (sub === 'setup') {
      const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels?.first();
      const cfg = db.getSettings(message.guild.id, 'birthday', {});
      cfg.channel = ch?.id || message.channel.id;
      db.saveSettings(message.guild.id, 'birthday', cfg);
      return message.reply({ embeds: [success(message.author, `Birthday announcements will post in <#${cfg.channel}>.`)] });
    }
    // view
    const target = (await resolveMember(message.guild, args[sub === 'view' ? 1 : 0]))?.user || message.author;
    const bd = db.getSettings(message.guild.id, `bday:${target.id}`, null);
    return message.channel.send({ embeds: [base().setDescription(bd ? `🎂 **${target.tag}**'s birthday is **${bd.date}**.` : `**${target.tag}** hasn't set a birthday.`)] });
  },
});

/** counting — one channel, increment by 1, no repeats. */
const counting = new Command({
  name: 'counting',
  category: 'engagement',
  description: 'Dedicated counting channel.',
  permLevel: LEVELS.ADMIN,
  usage: 'toggle | set <n> | reset | leaderboard',
  async run({ message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'counting', { channel: null, current: 0, lastUser: null, enabled: false });
    if (sub === 'toggle') {
      cfg.enabled = !cfg.enabled;
      cfg.channel = cfg.channel || message.channel.id;
      db.saveSettings(message.guild.id, 'counting', cfg);
      return message.reply({ embeds: [success(message.author, `Counting is **${cfg.enabled ? 'on' : 'off'}** in <#${cfg.channel}>. Start at **${cfg.current + 1}**.`)] });
    }
    if (sub === 'set') { cfg.current = parseInt(args[1], 10) || 0; db.saveSettings(message.guild.id, 'counting', cfg); return message.reply({ embeds: [success(message.author, `Count set to **${cfg.current}**.`)] }); }
    if (sub === 'reset') { cfg.current = 0; cfg.lastUser = null; db.saveSettings(message.guild.id, 'counting', cfg); return message.reply({ embeds: [success(message.author, 'Count reset to 0.')] }); }
    return message.channel.send({ embeds: [base().setTitle('Counting').setDescription(`**Channel:** ${cfg.channel ? `<#${cfg.channel}>` : 'none'}\n**Current:** ${cfg.current}\n**Enabled:** ${cfg.enabled}`)] });
  },
});

/** confessions — anonymous confessions posted by the bot. */
const confessions = new Command({
  name: 'confessions',
  aliases: ['confession'],
  category: 'engagement',
  description: 'Anonymous confession system.',
  permLevel: LEVELS.ADMIN,
  usage: 'toggle | config',
  async run({ message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'confessions', { channel: null, enabled: false, count: 0 });
    if (sub === 'toggle') { cfg.enabled = !cfg.enabled; cfg.channel = cfg.channel || message.channel.id; db.saveSettings(message.guild.id, 'confessions', cfg); return message.reply({ embeds: [success(message.author, `Confessions **${cfg.enabled ? 'on' : 'off'}** in <#${cfg.channel}>. Members use \`${prefix}confess <text>\`.`)] }); }
    return message.channel.send({ embeds: [base().setTitle('Confessions').setDescription(`**Enabled:** ${cfg.enabled}\n**Channel:** ${cfg.channel ? `<#${cfg.channel}>` : 'none'}\n**Total:** ${cfg.count}`)] });
  },
});

const confess = new Command({
  name: 'confess',
  category: 'engagement',
  description: 'Submit an anonymous confession.',
  permLevel: LEVELS.USER,
  usage: '<text>',
  async run({ message, args, prefix }) {
    const cfg = db.getSettings(message.guild.id, 'confessions', { channel: null, enabled: false, count: 0 });
    if (!cfg.enabled || !cfg.channel) return message.reply({ embeds: [error('Confessions are not set up here.')] });
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [error(`Usage: \`${prefix}confess <text>\``)] });
    const ch = message.guild.channels.cache.get(cfg.channel);
    cfg.count = (cfg.count || 0) + 1;
    db.saveSettings(message.guild.id, 'confessions', cfg);
    await ch?.send({ embeds: [base().setTitle(`Anonymous confession #${cfg.count}`).setDescription(text)] }).catch(() => {});
    await message.delete().catch(() => {});
    return message.author.send({ embeds: [success(null, 'Your confession was posted anonymously.')] }).catch(() => {});
  },
});

/** invites / tracker — basic invite counts. */
const invites = new Command({
  name: 'invites',
  category: 'engagement',
  description: 'View invite stats for a member.',
  permLevel: LEVELS.USER,
  usage: '[member]',
  async run({ client, message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || message.author;
    const data = db.getSettings(message.guild.id, 'invites', {});
    const count = data[target.id]?.total || 0;
    return message.channel.send({ embeds: [base().setDescription(`**${target.tag}** has **${count}** invite(s).`)] });
  },
});

const tracker = new Command({
  name: 'tracker',
  category: 'engagement',
  description: 'Invite tracking system.',
  permLevel: LEVELS.ADMIN,
  usage: 'toggle | leaderboard | reset',
  async run({ message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'trackercfg', { enabled: false });
    if (sub === 'toggle') { cfg.enabled = !cfg.enabled; db.saveSettings(message.guild.id, 'trackercfg', cfg); return message.reply({ embeds: [success(message.author, `Invite tracking **${cfg.enabled ? 'on' : 'off'}**.`)] }); }
    if (sub === 'leaderboard') {
      const data = db.getSettings(message.guild.id, 'invites', {});
      const sorted = Object.entries(data).sort((a, b) => (b[1].total || 0) - (a[1].total || 0)).slice(0, 100);
      if (!sorted.length) return message.reply({ embeds: [base().setDescription('No invite data yet.')] });
      const lines = sorted.map(([id, v], i) => `\`#${i + 1}\` <@${id}> — ${v.total} invites`);
      return paginate(message, chunk(lines, 10).map((c) => base().setTitle('Invite leaderboard').setDescription(c.join('\n'))), { userId: message.author.id });
    }
    if (sub === 'reset') { db.saveSettings(message.guild.id, 'invites', {}); return message.reply({ embeds: [success(message.author, 'Reset invite data.')] }); }
    return message.channel.send({ embeds: [base().setTitle('Invite tracker').setDescription(`**Enabled:** ${cfg.enabled}\n\`${prefix}tracker toggle/leaderboard/reset\``)] });
  },
});

module.exports = [birthday, counting, confessions, confess, invites, tracker];
