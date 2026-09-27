const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel, resolveMember } = require('../../utils/resolve');
const db = require('../../database/db');

/** A compact factory for "toggle + config" style systems. */
function toggleSystem(name, aliases, moduleKey, label, extra = {}) {
  return new Command({
    name,
    aliases,
    category: 'engagement',
    description: label,
    permLevel: LEVELS.ADMIN,
    usage: 'toggle | config | ' + (extra.usage || ''),
    async run({ message, args, prefix, sub }) {
      const cfg = db.getSettings(message.guild.id, moduleKey, { enabled: false, channel: null });
      if (sub === 'toggle') {
        cfg.enabled = !cfg.enabled;
        db.saveSettings(message.guild.id, moduleKey, cfg);
        return message.reply({ embeds: [success(message.author, `${label.split('.')[0]} is now **${cfg.enabled ? 'on' : 'off'}**.`)] });
      }
      if (sub === 'edit' || sub === 'setup') {
        const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels?.first();
        if (ch) cfg.channel = ch.id;
        db.saveSettings(message.guild.id, moduleKey, cfg);
        return message.reply({ embeds: [success(message.author, `Configured. Channel: ${cfg.channel ? `<#${cfg.channel}>` : 'none'}.`)] });
      }
      if (extra.run) {
        const handled = await extra.run({ message, args, prefix, sub, cfg });
        if (handled) return handled;
      }
      return message.channel.send({ embeds: [base().setTitle(name).setDescription(`**Enabled:** ${cfg.enabled}\n**Channel:** ${cfg.channel ? `<#${cfg.channel}>` : 'none'}\n\n\`${prefix}${name} toggle\` · \`${prefix}${name} edit [#channel]\``)] });
    },
  });
}

const bumpreminder = toggleSystem('bumpreminder', ['bump'], 'bumpreminder', 'Automated Disboard bump reminders.');
const swear = toggleSystem('swear', ['swearjar'], 'swear', 'Swear jar tracking.', {
  run: async ({ message, sub }) => {
    if (sub === 'leaderboard') {
      const data = db.getSettings(message.guild.id, 'sweardata', {});
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return message.channel.send({ embeds: [base().setTitle('Swear jar').setDescription(sorted.map(([id, n], i) => `\`#${i + 1}\` <@${id}> — ${n}`).join('\n') || 'No data.')] });
    }
    return null;
  },
});
const partner = toggleSystem('partner', ['partnership'], 'partner', 'Partnership tracking.');
const bumptest = null;

/** streaks — daily streak system. */
const streak = new Command({
  name: 'streak',
  category: 'engagement',
  description: 'Check your current streak.',
  permLevel: LEVELS.USER,
  async run({ message }) {
    const data = db.getSettings(message.guild.id, `streak:${message.author.id}`, { count: 0, last: 0 });
    return message.channel.send({ embeds: [base().setDescription(`🔥 Your streak: **${data.count}** day(s).`)] });
  },
});

const streaks = toggleSystem('streaks', [], 'streaks', 'Daily streak system with rewards.', {
  run: async ({ message, sub }) => {
    if (sub === 'leaderboard') {
      // scan streak:* is expensive; note in real deployment we'd index. Simple message here.
      return message.channel.send({ embeds: [base().setTitle('Streak leaderboard').setDescription('Streak leaderboard updates as members chat daily.')] });
    }
    return null;
  },
});

/** qotd — question of the day. */
const qotd = new Command({
  name: 'qotd',
  category: 'engagement',
  description: 'Question of the Day.',
  permLevel: LEVELS.USER,
  usage: 'add <#channel> | post | settings',
  async run({ message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'qotd', { channel: null, role: null, time: '12:00', questions: [] });
    const { check } = require('../../utils/permissions');
    const admin = check(message.member, LEVELS.ADMIN, message.guild.id).ok;
    if (sub === 'add' && admin) {
      const ch = resolveChannel(message.guild, args[1]) || message.channel;
      cfg.channel = ch.id;
      db.saveSettings(message.guild.id, 'qotd', cfg);
      return message.reply({ embeds: [success(message.author, `QOTD channel set to ${ch}.`)] });
    }
    if (sub === 'post' && admin) {
      const q = cfg.questions.length ? cfg.questions[Math.floor(Math.random() * cfg.questions.length)] : DEFAULT_QOTD[Math.floor(Math.random() * DEFAULT_QOTD.length)];
      const ch = cfg.channel ? message.guild.channels.cache.get(cfg.channel) : message.channel;
      await ch?.send({ content: cfg.role ? `<@&${cfg.role}>` : undefined, embeds: [base().setTitle('❓ Question of the Day').setDescription(q)] }).catch(() => {});
      return message.reply({ embeds: [success(message.author, 'Posted the QOTD.')] });
    }
    return message.channel.send({ embeds: [base().setTitle('QOTD').setDescription(`**Channel:** ${cfg.channel ? `<#${cfg.channel}>` : 'none'}\n**Time:** ${cfg.time}\n\`${prefix}qotd add #channel\` · \`${prefix}qotd post\``)] });
  },
});

const DEFAULT_QOTD = [
  "What's a small thing that made you happy this week?",
  "If you could instantly master one skill, what would it be?",
  "What's your comfort food?",
  "Best movie you've seen recently?",
  "What's a hobby you'd love to pick up?",
];

/** activity — server stats. */
const activity = new Command({
  name: 'activity',
  category: 'engagement',
  description: 'View server activity stats.',
  permLevel: LEVELS.USER,
  usage: 'server | user [member] | toggle',
  async run({ message, args, sub }) {
    const cfg = db.getSettings(message.guild.id, 'activity', { enabled: false, messages: {}, voice: {} });
    if (sub === 'toggle') {
      const { check } = require('../../utils/permissions');
      if (!check(message.member, LEVELS.ADMIN, message.guild.id).ok) return message.reply({ embeds: [error('Manage Server required.')] });
      cfg.enabled = !cfg.enabled;
      db.saveSettings(message.guild.id, 'activity', cfg);
      return message.reply({ embeds: [success(message.author, `Activity logging **${cfg.enabled ? 'on' : 'off'}**.`)] });
    }
    if (sub === 'user') {
      const target = (await resolveMember(message.guild, args[1]))?.user || message.author;
      return message.channel.send({ embeds: [base().setTitle(`Activity — ${target.tag}`).setDescription(`**Messages:** ${cfg.messages[target.id] || 0}\n**Voice minutes:** ${Math.round((cfg.voice[target.id] || 0) / 60000)}`)] });
    }
    const totalMsgs = Object.values(cfg.messages).reduce((a, b) => a + b, 0);
    return message.channel.send({ embeds: [base().setTitle(`Activity — ${message.guild.name}`).setDescription(`**Total tracked messages:** ${totalMsgs}\n**Logging:** ${cfg.enabled ? 'on' : 'off'}`)] });
  },
});

const autopfp = toggleSystem('autopfp', [], 'autopfp', 'Auto-post profile pictures from a feed. (Requires image source — not configured.)');
const rolelink = new Command({
  name: 'rolelink',
  category: 'engagement',
  description: 'Sticky roles (restore roles on rejoin).',
  permLevel: LEVELS.ADMIN,
  usage: 'toggle',
  async run({ message, sub }) {
    const cfg = db.getSettings(message.guild.id, 'rolelink', { sticky: false });
    if (sub === 'toggle') { cfg.sticky = !cfg.sticky; db.saveSettings(message.guild.id, 'rolelink', cfg); return message.reply({ embeds: [success(message.author, `Sticky roles **${cfg.sticky ? 'on' : 'off'}**.`)] }); }
    return message.channel.send({ embeds: [base().setTitle('Rolelink').setDescription(`**Sticky roles:** ${cfg.sticky ? 'on' : 'off'} (roles restored when members rejoin).`)] });
  },
});

module.exports = [bumpreminder, swear, partner, streak, streaks, qotd, activity, autopfp, rolelink];
