const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, resolveUser, resolveRole, resolveChannel } = require('../../utils/resolve');
const db = require('../../database/db');
const { paginate, chunk } = require('../../utils/paginate');

function xpNeeded(level) {
  return 5 * level * level + 50 * level + 100;
}

const rank = new Command({
  name: 'rank',
  aliases: ['level', 'lvl'],
  category: 'engagement',
  description: 'View your level and XP.',
  permLevel: LEVELS.USER,
  usage: '[member]',
  async run({ client, message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || (await resolveUser(client, args[0])) || message.mentions.users.first() || message.author;
    const row = db.getLevel(message.guild.id, target.id);
    const needed = xpNeeded(row.level);
    const bar = progressBar(row.xp, needed);
    return message.channel.send({
      embeds: [base().setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() }).setDescription(`**Level:** ${row.level}\n**XP:** ${row.xp} / ${needed}\n${bar}`)],
    });
  },
});

function progressBar(cur, max, size = 20) {
  const ratio = Math.min(1, cur / max);
  const filled = Math.round(ratio * size);
  return `\`${'█'.repeat(filled)}${'░'.repeat(size - filled)}\` ${Math.round(ratio * 100)}%`;
}

const leaderboard = new Command({
  name: 'leaderboard',
  aliases: ['lb', 'levels-lb', 'top'],
  category: 'engagement',
  description: "View the server's level leaderboard.",
  permLevel: LEVELS.USER,
  async run({ message }) {
    const rows = db.topLevels(message.guild.id, 100);
    if (!rows.length) return message.reply({ embeds: [base().setDescription('No ranking data yet.')] });
    const lines = rows.map((r, i) => `\`#${i + 1}\` <@${r.user_id}> — level **${r.level}** (${r.xp} xp)`);
    const pages = chunk(lines, 10).map((c) => base().setTitle(`${message.guild.name} — Leaderboard`).setDescription(c.join('\n')));
    return paginate(message, pages, { userId: message.author.id });
  },
});

const levels = new Command({
  name: 'levels',
  category: 'engagement',
  description: 'Manage the leveling system.',
  permLevel: LEVELS.ADMIN,
  usage: 'toggle/config/edit/setxp/addxp/removexp/setlevel/resetxp/reset/rewards',
  async run({ client, message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'leveling', { enabled: false, perMessage: 15, cooldown: 60000, announce: true, channel: null, rewards: {} });

    switch (sub) {
      case 'toggle':
        cfg.enabled = !cfg.enabled;
        db.saveSettings(message.guild.id, 'leveling', cfg);
        return message.reply({ embeds: [success(message.author, `Leveling is now **${cfg.enabled ? 'on' : 'off'}**.`)] });
      case 'config':
        return message.channel.send({ embeds: [base().setTitle('Leveling config').setDescription(`**Enabled:** ${cfg.enabled}\n**XP/msg:** ${cfg.perMessage}\n**Cooldown:** ${cfg.cooldown / 1000}s\n**Announce:** ${cfg.announce}\n**Channel:** ${cfg.channel ? `<#${cfg.channel}>` : 'current'}\n**Rewards:** ${Object.entries(cfg.rewards).map(([l, r]) => `L${l}→<@&${r}>`).join(', ') || 'none'}`)] });
      case 'edit': {
        const key = (args[1] || '').toLowerCase();
        if (key === 'xp') cfg.perMessage = parseInt(args[2], 10) || cfg.perMessage;
        else if (key === 'cooldown') cfg.cooldown = (parseInt(args[2], 10) || 60) * 1000;
        else if (key === 'channel') { const ch = resolveChannel(message.guild, args[2]); cfg.channel = ch?.id || null; }
        else if (key === 'announce') cfg.announce = args[2] !== 'off';
        else return message.reply({ embeds: [error(`Usage: \`${prefix}levels edit <xp|cooldown|channel|announce> <value>\``)] });
        db.saveSettings(message.guild.id, 'leveling', cfg);
        return message.reply({ embeds: [success(message.author, 'Updated leveling settings.')] });
      }
      case 'rewards': {
        const action = (args[1] || '').toLowerCase();
        if (action === 'add') {
          const lvl = parseInt(args[2], 10);
          const role = resolveRole(message.guild, args.slice(3).join(' ')) || message.mentions.roles?.first();
          if (Number.isNaN(lvl) || !role) return message.reply({ embeds: [error(`Usage: \`${prefix}levels rewards add <level> <role>\``)] });
          cfg.rewards[String(lvl)] = role.id;
          db.saveSettings(message.guild.id, 'leveling', cfg);
          return message.reply({ embeds: [success(message.author, `Level **${lvl}** now rewards **${role.name}**.`)] });
        }
        if (action === 'remove') { delete cfg.rewards[args[2]]; db.saveSettings(message.guild.id, 'leveling', cfg); return message.reply({ embeds: [success(message.author, 'Removed reward.')] }); }
        return message.channel.send({ embeds: [base().setTitle('Level rewards').setDescription(Object.entries(cfg.rewards).map(([l, r]) => `Level ${l} → <@&${r}>`).join('\n') || 'None.')] });
      }
      case 'setxp':
      case 'addxp':
      case 'removexp':
      case 'setlevel':
      case 'resetxp': {
        const target = (await resolveMember(message.guild, args[1]))?.user || message.mentions.users.first();
        if (!target) return message.reply({ embeds: [error('Member not found.')] });
        const row = db.getLevel(message.guild.id, target.id);
        const amount = parseInt(args[2], 10) || 0;
        if (sub === 'setxp') row.xp = amount;
        else if (sub === 'addxp') row.xp += amount;
        else if (sub === 'removexp') row.xp = Math.max(0, row.xp - amount);
        else if (sub === 'setlevel') row.level = amount;
        else if (sub === 'resetxp') { row.xp = 0; row.level = 0; }
        db.saveLevel(message.guild.id, target.id, row.xp, row.level, row.last_msg || 0);
        return message.reply({ embeds: [success(message.author, `Updated **${target.tag}** → level ${row.level}, ${row.xp} xp.`)] });
      }
      case 'reset':
        db.raw.prepare('DELETE FROM levels WHERE guild_id = ?').run(message.guild.id);
        return message.reply({ embeds: [success(message.author, 'Reset all member levels.')] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Leveling').setDescription(`\`${prefix}levels toggle/config/edit/rewards/setxp/addxp/removexp/setlevel/resetxp/reset\``)] });
    }
  },
});

module.exports = [rank, leaderboard, levels];
