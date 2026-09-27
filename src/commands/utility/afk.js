const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { parseDuration, formatDuration } = require('../../utils/resolve');
const { paginate, chunk } = require('../../utils/paginate');
const db = require('../../database/db');

const afk = new Command({
  name: 'afk', category: 'utility', description: 'Set your AFK status.', permLevel: LEVELS.USER, usage: '[reason]',
  async run({ message, args }) {
    const reason = args.join(' ') || 'AFK';
    db.setAfk(message.guild.id, message.author.id, reason);
    // Start a fresh mentions log for this AFK session.
    db.saveSettings(message.guild.id, `afkmentions:${message.author.id}`, { list: [] });
    return message.reply({ embeds: [success(message.author, `You are now AFK: ${reason}`)] });
  },
});

const afkmentions = new Command({
  name: 'afkmentions', aliases: ['afkm', 'mentions'], category: 'utility', description: 'See who mentioned you while you were AFK.', permLevel: LEVELS.USER,
  async run({ message }) {
    const store = db.getSettings(message.guild.id, `afkmentions:${message.author.id}`, { list: [] });
    const list = store.list || [];
    if (!list.length) return message.reply({ embeds: [base().setDescription('Nobody mentioned you while you were away. 🎉')] });
    const lines = list
      .slice()
      .reverse()
      .map((m) => `**${m.tag}** · <t:${m.at}:R> · [jump](${m.url})\n> ${m.content || '*(no text)*'}`);
    const pages = chunk(lines, 8).map((c) => base().setTitle(`Mentions while AFK (${list.length})`).setDescription(c.join('\n\n')));
    return paginate(message, pages, { userId: message.author.id });
  },
});

const count = new Command({
  name: 'count', aliases: ['servercount', 'membercount2'], category: 'utility', description: 'Show member and voice-channel counts.', permLevel: LEVELS.USER,
  async run({ message }) {
    const g = message.guild;
    await g.members.fetch().catch(() => {});
    const bots = g.members.cache.filter((m) => m.user.bot).size;
    const humans = g.memberCount - bots;
    const inVoice = g.members.cache.filter((m) => m.voice?.channelId).size;
    const voiceChannels = g.channels.cache.filter((c) => c.isVoiceBased()).size;
    return message.channel.send({
      embeds: [
        base()
          .setTitle(`${g.name} — counts`)
          .addFields(
            { name: '👥 Members', value: `**${g.memberCount}** total\n${humans} humans · ${bots} bots`, inline: true },
            { name: '🔊 In Voice', value: `**${inVoice}** in ${voiceChannels} channel(s)`, inline: true }
          ),
      ],
    });
  },
});

const snipe = new Command({
  name: 'snipe', aliases: ['s'], category: 'utility', description: 'Show the last deleted message.', permLevel: LEVELS.USER, usage: '[index]',
  async run({ client, message, args }) {
    const arr = client.snipes.get(message.channel.id) || [];
    const idx = Math.max(0, (parseInt(args[0], 10) || 1) - 1);
    const s = arr[idx];
    if (!s) return message.reply({ embeds: [error('Nothing to snipe.')] });
    const e = base().setAuthor({ name: s.author, iconURL: s.avatar }).setDescription(s.content || '*[no text]*').setFooter({ text: `Sniped • ${idx + 1}/${arr.length}` }).setTimestamp(s.at);
    if (s.attachment) e.setImage(s.attachment);
    return message.channel.send({ embeds: [e] });
  },
});

const editsnipe = new Command({
  name: 'editsnipe', aliases: ['es'], category: 'utility', description: 'Show the last edited message.', permLevel: LEVELS.USER, usage: '[index]',
  async run({ client, message, args }) {
    const arr = client.editSnipes.get(message.channel.id) || [];
    const idx = Math.max(0, (parseInt(args[0], 10) || 1) - 1);
    const s = arr[idx];
    if (!s) return message.reply({ embeds: [error('Nothing to snipe.')] });
    return message.channel.send({ embeds: [base().setAuthor({ name: s.author, iconURL: s.avatar }).setDescription(`**Before:** ${s.before || '*none*'}\n**After:** ${s.after || '*none*'}`).setFooter({ text: `Edit-sniped • ${idx + 1}/${arr.length}` })] });
  },
});

const clearsnipes = new Command({
  name: 'clearsnipes', category: 'utility', description: 'Clear stored snipes for this channel.', permLevel: LEVELS.MOD,
  async run({ client, message }) {
    client.snipes.delete(message.channel.id);
    client.editSnipes.delete(message.channel.id);
    client.reactionSnipes.delete(message.channel.id);
    return message.reply({ embeds: [success(message.author, 'Cleared snipes here.')] });
  },
});

const poll = new Command({
  name: 'poll', category: 'utility', description: 'Create a reaction poll.', permLevel: LEVELS.MOD, usage: '<question> | <opt1> | <opt2> ...',
  async run({ message, args, prefix }) {
    const parts = args.join(' ').split('|').map((s) => s.trim()).filter(Boolean);
    if (parts.length < 1) return message.reply({ embeds: [error(`Usage: \`${prefix}poll <question> | <option1> | <option2>\``)] });
    const question = parts[0];
    const options = parts.slice(1);
    const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    if (!options.length) {
      const m = await message.channel.send({ embeds: [base().setTitle('📊 Poll').setDescription(question).setFooter({ text: `by ${message.author.tag}` })] });
      await m.react('👍').catch(() => {});
      await m.react('👎').catch(() => {});
      return message.delete().catch(() => {});
    }
    const desc = options.map((o, i) => `${nums[i]} ${o}`).join('\n');
    const m = await message.channel.send({ embeds: [base().setTitle(`📊 ${question}`).setDescription(desc).setFooter({ text: `by ${message.author.tag}` })] });
    for (let i = 0; i < options.length && i < 10; i++) await m.react(nums[i]).catch(() => {});
    return message.delete().catch(() => {});
  },
});

const remind = new Command({
  name: 'remind', aliases: ['remindme', 'reminder'], category: 'utility', description: 'Set a reminder.', permLevel: LEVELS.USER, usage: '<duration> <message> | list | remove <n>',
  async run({ message, args, prefix, sub }) {
    if (sub === 'list') {
      const rows = db.raw.prepare("SELECT * FROM timers WHERE type = 'reminder' AND target_id = ? ORDER BY expires_at").all(message.author.id);
      if (!rows.length) return message.reply({ embeds: [base().setDescription('No active reminders.')] });
      return message.channel.send({ embeds: [base().setTitle('Your reminders').setDescription(rows.map((r, i) => `\`${i + 1}\` <t:${Math.floor(r.expires_at / 1000)}:R> — ${JSON.parse(r.data || '{}').message || ''}`).join('\n'))] });
    }
    const duration = parseDuration(args[0]);
    const text = args.slice(1).join(' ');
    if (!duration || !text) return message.reply({ embeds: [error(`Usage: \`${prefix}remind <duration> <message>\``)] });
    db.addTimer(message.guild.id, 'reminder', message.author.id, { message: text, channelId: message.channel.id }, Date.now() + duration);
    return message.reply({ embeds: [success(message.author, `I'll remind you in **${formatDuration(duration)}**.`)] });
  },
});

const calculate = new Command({
  name: 'calculate', aliases: ['calc', 'math'], category: 'utility', description: 'Evaluate a math expression.', permLevel: LEVELS.USER, usage: '<expression>',
  async run({ message, args }) {
    const expr = args.join(' ');
    if (!expr) return message.reply({ embeds: [error('Provide an expression.')] });
    // Safe eval: only allow digits, operators, parentheses, decimal points.
    if (!/^[\d+\-*/%.()\s]+$/.test(expr)) return message.reply({ embeds: [error('Only numbers and + - * / % ( ) are allowed.')] });
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr})`)();
      return message.channel.send({ embeds: [base().setDescription(`\`${expr}\` = **${result}**`)] });
    } catch {
      return message.reply({ embeds: [error('Invalid expression.')] });
    }
  },
});

module.exports = [afk, afkmentions, count, snipe, editsnipe, clearsnipes, poll, remind, calculate];
