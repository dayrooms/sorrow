const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember } = require('../../utils/resolve');
const db = require('../../database/db');

// Relationships are stored per-guild in settings 'relationships':
// { married: {uid: partnerId}, children: {parentId: [childIds]}, parents: {childId: parentId} }
function getRel(guild) {
  return db.getSettings(guild.id, 'relationships', { married: {}, children: {}, parents: {} });
}
function saveRel(guild, data) {
  db.saveSettings(guild.id, 'relationships', data);
}

const marry = new Command({
  name: 'marry', category: 'fun', description: 'Propose to another user.', permLevel: LEVELS.USER, usage: '<member>',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first();
    if (!target || target.id === message.author.id || target.bot) return message.reply({ embeds: [error('Mention someone to marry.')] });
    const rel = getRel(message.guild);
    if (rel.married[message.author.id]) return message.reply({ embeds: [error('You are already married! Divorce first.')] });
    if (rel.married[target.id]) return message.reply({ embeds: [error('They are already married to someone else.')] });
    rel.married[message.author.id] = target.id;
    rel.married[target.id] = message.author.id;
    saveRel(message.guild, rel);
    return message.channel.send({ embeds: [base(0xff69b4).setDescription(`💍 **${message.author.username}** married **${target.username}**! Congratulations! 🎉`)] });
  },
});

const divorce = new Command({
  name: 'divorce', category: 'fun', description: 'Divorce your partner.', permLevel: LEVELS.USER,
  async run({ message }) {
    const rel = getRel(message.guild);
    const partner = rel.married[message.author.id];
    if (!partner) return message.reply({ embeds: [error('You are not married.')] });
    delete rel.married[message.author.id];
    delete rel.married[partner];
    saveRel(message.guild, rel);
    return message.channel.send({ embeds: [base().setDescription(`💔 **${message.author.username}** divorced <@${partner}>.`)] });
  },
});

const adopt = new Command({
  name: 'adopt', category: 'fun', description: 'Adopt another user.', permLevel: LEVELS.USER, usage: '<member>',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first();
    if (!target || target.id === message.author.id) return message.reply({ embeds: [error('Mention someone to adopt.')] });
    const rel = getRel(message.guild);
    rel.children[message.author.id] = rel.children[message.author.id] || [];
    if (rel.children[message.author.id].length >= 5) return message.reply({ embeds: [error('You can have at most 5 children.')] });
    if (rel.parents[target.id]) return message.reply({ embeds: [error('They already have a parent.')] });
    rel.children[message.author.id].push(target.id);
    rel.parents[target.id] = message.author.id;
    saveRel(message.guild, rel);
    return message.channel.send({ embeds: [base().setDescription(`👶 **${message.author.username}** adopted **${target.username}**!`)] });
  },
});

const disown = new Command({
  name: 'disown', category: 'fun', description: 'Disown an adopted child.', permLevel: LEVELS.USER, usage: '<member>',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first();
    if (!target) return message.reply({ embeds: [error('Mention a child.')] });
    const rel = getRel(message.guild);
    rel.children[message.author.id] = (rel.children[message.author.id] || []).filter((id) => id !== target.id);
    if (rel.parents[target.id] === message.author.id) delete rel.parents[target.id];
    saveRel(message.guild, rel);
    return message.channel.send({ embeds: [base().setDescription(`😢 **${message.author.username}** disowned **${target.username}**.`)] });
  },
});

const runaway = new Command({
  name: 'runaway', category: 'fun', description: 'Run away from your parent.', permLevel: LEVELS.USER,
  async run({ message }) {
    const rel = getRel(message.guild);
    const parent = rel.parents[message.author.id];
    if (!parent) return message.reply({ embeds: [error('You have no parent.')] });
    rel.children[parent] = (rel.children[parent] || []).filter((id) => id !== message.author.id);
    delete rel.parents[message.author.id];
    saveRel(message.guild, rel);
    return message.channel.send({ embeds: [base().setDescription(`🏃 **${message.author.username}** ran away from home!`)] });
  },
});

const family = new Command({
  name: 'family', category: 'fun', description: 'View your family tree.', permLevel: LEVELS.USER, usage: '[member]',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || message.author;
    const rel = getRel(message.guild);
    const partner = rel.married[target.id];
    const kids = rel.children[target.id] || [];
    const parent = rel.parents[target.id];
    return message.channel.send({ embeds: [base().setTitle(`${target.username}'s family`).setDescription([`**Partner:** ${partner ? `<@${partner}>` : 'none'}`, `**Parent:** ${parent ? `<@${parent}>` : 'none'}`, `**Children:** ${kids.length ? kids.map((k) => `<@${k}>`).join(', ') : 'none'}`].join('\n'))] });
  },
});

// blunt — shared session per guild
const blunt = new Command({
  name: 'blunt', category: 'fun', description: 'Blunt session.', permLevel: LEVELS.USER, usage: 'light/hit/give/steal/leaderboard',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'blunt', { holder: null, hits: {}, lit: false });
    switch (sub) {
      case 'light':
        data.lit = true; data.holder = message.author.id; db.saveSettings(message.guild.id, 'blunt', data);
        return message.channel.send({ embeds: [base().setDescription(`🚬 **${message.author.username}** lit the blunt. Use \`${prefix}blunt hit\`.`)] });
      case 'hit':
        if (!data.lit) return message.reply({ embeds: [error(`Nobody's lit one. Use \`${prefix}blunt light\`.`)] });
        if (data.holder !== message.author.id) return message.reply({ embeds: [error("You don't have the blunt.")] });
        data.hits[message.author.id] = (data.hits[message.author.id] || 0) + 1;
        db.saveSettings(message.guild.id, 'blunt', data);
        return message.channel.send({ embeds: [base().setDescription(`💨 **${message.author.username}** took a hit! (${data.hits[message.author.id]} total)`)] });
      case 'give': {
        if (data.holder !== message.author.id) return message.reply({ embeds: [error("You don't have the blunt.")] });
        const target = (await resolveMember(message.guild, args[1]))?.user || message.mentions.users.first();
        if (!target) return message.reply({ embeds: [error('Give it to who?')] });
        data.holder = target.id; db.saveSettings(message.guild.id, 'blunt', data);
        return message.channel.send({ embeds: [base().setDescription(`🤝 Passed the blunt to **${target.username}**.`)] });
      }
      case 'steal': {
        const target = (await resolveMember(message.guild, args[1]))?.user || message.mentions.users.first();
        if (!data.lit) return message.reply({ embeds: [error('No blunt lit.')] });
        if (Math.random() < 0.5) { data.holder = message.author.id; db.saveSettings(message.guild.id, 'blunt', data); return message.channel.send({ embeds: [base().setDescription(`😏 **${message.author.username}** stole the blunt!`)] }); }
        return message.channel.send({ embeds: [base().setDescription(`😂 **${message.author.username}** failed to steal it.`)] });
      }
      case 'leaderboard': {
        const sorted = Object.entries(data.hits).sort((a, b) => b[1] - a[1]).slice(0, 10);
        return message.channel.send({ embeds: [base().setTitle('🚬 Blunt leaderboard').setDescription(sorted.map(([id, n], i) => `\`#${i + 1}\` <@${id}> — ${n} hits`).join('\n') || 'No hits yet.')] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Blunt').setDescription(`\`${prefix}blunt light/hit/give/steal/leaderboard\``)] });
    }
  },
});

const smoke = new Command({ name: 'smoke', category: 'fun', description: 'Shortcut for blunt hit.', permLevel: LEVELS.USER, async run(ctx) { ctx.args = ['hit']; ctx.sub = 'hit'; return blunt.run(ctx); } });

module.exports = [marry, divorce, adopt, disown, runaway, family, blunt, smoke];
