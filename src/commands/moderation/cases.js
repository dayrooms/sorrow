const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, resolveUser } = require('../../utils/resolve');
const db = require('../../database/db');
const { paginate, chunk } = require('../../utils/paginate');

const history = new Command({
  name: 'history',
  aliases: ['modlogs', 'cases'],
  category: 'moderation',
  description: 'View punishment history for a user or the server.',
  permLevel: LEVELS.MOD,
  usage: '[member]',
  async run({ client, message, args }) {
    const target = (await resolveMember(message.guild, args[0])) || (await resolveUser(client, args[0])) || message.mentions.users.first();
    const cases = target ? db.getUserCases(message.guild.id, target.id || target.user?.id) : db.getGuildCases(message.guild.id, 100);
    if (!cases.length) return message.reply({ embeds: [base().setDescription('No cases found.')] });
    const lines = cases.map((c) => `\`#${c.case_no}\` **${c.action}** ${target ? '' : `<@${c.user_id}> `}— ${c.reason || 'No reason'} · <t:${c.created_at}:R> (by <@${c.mod_id}>)`);
    const pages = chunk(lines, 10).map((ch) => base().setTitle(target ? `History — ${target.tag || target.user?.tag}` : `Server history`).setDescription(ch.join('\n')));
    return paginate(message, pages, { userId: message.author.id });
  },
});

const reason = new Command({
  name: 'reason',
  category: 'moderation',
  description: 'Edit a case reason.',
  permLevel: LEVELS.MOD,
  usage: '<caseId> <new reason>',
  async run({ message, args, prefix }) {
    const caseNo = parseInt(args[0], 10);
    const newReason = args.slice(1).join(' ');
    if (Number.isNaN(caseNo) || !newReason) return message.reply({ embeds: [error(`Usage: \`${prefix}reason <caseId> <new reason>\``)] });
    const res = db.raw.prepare('UPDATE cases SET reason = ? WHERE guild_id = ? AND case_no = ?').run(newReason, message.guild.id, caseNo);
    if (!res.changes) return message.reply({ embeds: [error(`Case #${caseNo} not found.`)] });
    return message.reply({ embeds: [success(message.author, `Updated reason for Case #${caseNo}.`)] });
  },
});

const caseCmd = new Command({
  name: 'case',
  category: 'moderation',
  description: 'View or manage a moderation case.',
  permLevel: LEVELS.MOD,
  usage: '<caseId> | add/remove/reset/edit/view',
  async run({ message, args, prefix }) {
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'view' || /^\d+$/.test(sub)) {
      const caseNo = parseInt(/^\d+$/.test(sub) ? sub : args[1], 10);
      const c = db.raw.prepare('SELECT * FROM cases WHERE guild_id = ? AND case_no = ?').get(message.guild.id, caseNo);
      if (!c) return message.reply({ embeds: [error('Case not found.')] });
      return message.channel.send({
        embeds: [
          base().setTitle(`Case #${c.case_no}`).setDescription(
            [`**Action:** ${c.action}`, `**User:** <@${c.user_id}>`, `**Moderator:** <@${c.mod_id}>`, `**Reason:** ${c.reason || 'None'}`, `**When:** <t:${c.created_at}:F>`].join('\n')
          ),
        ],
      });
    }
    if (sub === 'remove') {
      const ids = args.slice(1).map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n)).slice(0, 5);
      if (!ids.length) return message.reply({ embeds: [error(`Usage: \`${prefix}case remove <caseIds...>\``)] });
      const stmt = db.raw.prepare('DELETE FROM cases WHERE guild_id = ? AND case_no = ?');
      let n = 0;
      for (const id of ids) n += stmt.run(message.guild.id, id).changes;
      return message.reply({ embeds: [success(message.author, `Removed **${n}** case(s).`)] });
    }
    if (sub === 'reset') {
      const target = (await resolveUser(message.client, args[1])) || message.mentions.users.first();
      if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}case reset <user>\``)] });
      const res = db.raw.prepare('DELETE FROM cases WHERE guild_id = ? AND user_id = ?').run(message.guild.id, target.id);
      return message.reply({ embeds: [success(message.author, `Deleted **${res.changes}** case(s) for **${target.tag}**.`)] });
    }
    return message.reply({ embeds: [error(`Usage: \`${prefix}case <id>\` or \`${prefix}case remove/reset/view\``)] });
  },
});

const modstats = new Command({
  name: 'modstats',
  category: 'moderation',
  description: 'View moderation stats for a staff member.',
  permLevel: LEVELS.MOD,
  usage: '[member]',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0])) || message.member;
    const rows = db.raw.prepare('SELECT action, COUNT(*) n FROM cases WHERE guild_id = ? AND mod_id = ? GROUP BY action').all(message.guild.id, target.id);
    if (!rows.length) return message.reply({ embeds: [base().setDescription(`**${target.user.tag}** has taken no moderation actions.`)] });
    const total = rows.reduce((a, r) => a + r.n, 0);
    return message.channel.send({
      embeds: [base().setTitle(`Mod stats — ${target.user.tag}`).setDescription(`**Total:** ${total}\n${rows.map((r) => `${r.action}: **${r.n}**`).join('\n')}`)],
    });
  },
});

module.exports = [history, reason, caseCmd, modstats];
