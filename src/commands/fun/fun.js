const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base, error } = require('../../utils/embed');
const { resolveMember } = require('../../utils/resolve');

/** Deterministic-ish random meter keyed on user id so it's stable per person per day. */
function meter(id, salt) {
  let h = 0;
  const key = `${id}:${salt}:${new Date().toDateString()}`;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 101;
}
function bar(pct) {
  const filled = Math.round((pct / 100) * 12);
  return `\`${'█'.repeat(filled)}${'░'.repeat(12 - filled)}\` ${pct}%`;
}

function meterCommand(name, aliases, salt, label, emoji) {
  return new Command({
    name, aliases, category: 'fun', description: `Check ${label}.`, permLevel: LEVELS.USER, usage: '[member]',
    async run({ message, args }) {
      const target = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first() || message.author;
      const pct = meter(target.id, salt);
      return message.channel.send({ embeds: [base().setDescription(`${emoji} **${target.username}** is **${pct}%** ${label}.\n${bar(pct)}`)] });
    },
  });
}

const meters = [
  meterCommand('howgay', [], 'gay', 'gay', '🌈'),
  meterCommand('howlesbian', [], 'lesbian', 'lesbian', '🏳️‍🌈'),
  meterCommand('howsus', ['howautism'], 'sus', 'sus', '🤨'),
  meterCommand('rizz', [], 'rizz', 'rizz', '😏'),
  meterCommand('aura', [], 'aura', 'aura', '🔮'),
  meterCommand('iq', [], 'iq', 'IQ', '🧠'),
  meterCommand('bitches', [], 'bitches', 'bitches', '💅'),
  meterCommand('motion', [], 'motion', 'motion & clout', '🌊'),
];

const ship = new Command({
  name: 'ship', category: 'fun', description: 'Check love compatibility.', permLevel: LEVELS.USER, usage: '<member> [member2]',
  async run({ message, args }) {
    const a = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first() || message.author;
    const b = (await resolveMember(message.guild, args[1]))?.user || message.mentions.users.at(1) || message.author;
    const pct = meter([a.id, b.id].sort().join(''), 'ship');
    const name = a.username.slice(0, a.username.length / 2) + b.username.slice(b.username.length / 2);
    return message.channel.send({ embeds: [base(0xff69b4).setTitle('💘 Ship').setDescription(`**${a.username}** 💕 **${b.username}**\n**${pct}%** — ${name}\n${bar(pct)}`)] });
  },
});

const rps = new Command({
  name: 'rps', category: 'fun', description: 'Rock paper scissors.', permLevel: LEVELS.USER, usage: '<rock|paper|scissors>',
  async run({ message, args }) {
    const choices = ['rock', 'paper', 'scissors'];
    const user = (args[0] || '').toLowerCase();
    if (!choices.includes(user)) return message.reply({ embeds: [error('Choose rock, paper, or scissors.')] });
    const bot = choices[Math.floor(Math.random() * 3)];
    const win = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const result = bot === user ? "It's a tie!" : win[user] === bot ? 'You win! 🎉' : 'You lose! 😢';
    return message.channel.send({ embeds: [base().setDescription(`You: **${user}**\nMe: **${bot}**\n\n${result}`)] });
  },
});

const choose = new Command({
  name: 'choose', aliases: ['pick'], category: 'fun', description: 'Pick one of your options.', permLevel: LEVELS.USER, usage: '<opt1> | <opt2> ...',
  async run({ message, args }) {
    const opts = args.join(' ').split(/,|\|/).map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) return message.reply({ embeds: [error('Give at least two options separated by `,` or `|`.')] });
    return message.channel.send({ embeds: [base().setDescription(`🤔 I choose: **${opts[Math.floor(Math.random() * opts.length)]}**`)] });
  },
});

const eightball = new Command({
  name: '8ball', aliases: ['eightball'], category: 'fun', description: 'Ask the magic 8-ball.', permLevel: LEVELS.USER, usage: '<question>',
  async run({ message, args }) {
    if (!args.length) return message.reply({ embeds: [error('Ask a question.')] });
    const answers = ['It is certain.', 'Without a doubt.', 'Yes, definitely.', 'Most likely.', 'Ask again later.', 'Cannot predict now.', "Don't count on it.", 'My reply is no.', 'Very doubtful.', 'Outlook not so good.', 'Signs point to yes.', 'Absolutely not.'];
    return message.channel.send({ embeds: [base().setDescription(`🎱 ${answers[Math.floor(Math.random() * answers.length)]}`)] });
  },
});

const wyr = new Command({
  name: 'wouldyourather', aliases: ['wyr'], category: 'fun', description: 'Would you rather.', permLevel: LEVELS.USER,
  async run({ message }) {
    const qs = [
      'be able to fly or be invisible?',
      'have unlimited money or unlimited time?',
      'never use social media again or never watch another show?',
      'always be 10 minutes late or 20 minutes early?',
      'fight one horse-sized duck or 100 duck-sized horses?',
    ];
    return message.channel.send({ embeds: [base().setTitle('🤔 Would you rather...').setDescription(qs[Math.floor(Math.random() * qs.length)])] });
  },
});

const wanted = new Command({
  name: 'wanted', category: 'fun', description: 'Generate a wanted poster.', permLevel: LEVELS.USER, usage: '[member] [bounty]',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first() || message.author;
    const bounty = args.find((a) => /^\$?\d+$/.test(a)) || `$${(Math.floor(Math.random() * 900) + 100) * 1000}`;
    return message.channel.send({ embeds: [base(0x8b5a2b).setTitle('🤠 WANTED — Dead or Alive').setDescription(`**${target.username}**\nBounty: **${bounty}**`).setImage(target.displayAvatarURL({ size: 256 }))] });
  },
});

const tweet = new Command({
  name: 'tweet', aliases: ['faketweet'], category: 'fun', description: 'Generate a fake (clearly-marked) tweet.', permLevel: LEVELS.USER, usage: '[member] <text>',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first() || message.author;
    const text = args.filter((a) => !a.match(/^<@!?\d+>$/)).join(' ') || '...';
    return message.channel.send({ embeds: [base(0x1da1f2).setAuthor({ name: `${target.username} (@${target.username})`, iconURL: target.displayAvatarURL() }).setDescription(text).setFooter({ text: '⚠️ Parody — not a real tweet' })] });
  },
});

const fakemessage = new Command({
  name: 'fakemessage', aliases: ['fakemsg'], category: 'fun', description: 'Generate a clearly-marked fake message.', permLevel: LEVELS.USER, usage: '<member> <text>',
  async run({ message, args }) {
    const target = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [error('Mention a member.')] });
    const text = args.filter((a) => !a.match(/^<@!?\d+>$/)).join(' ');
    if (!text) return message.reply({ embeds: [error('Provide text.')] });
    return message.channel.send({ embeds: [base().setAuthor({ name: `${target.displayName} [FAKE]`, iconURL: target.user.displayAvatarURL() }).setDescription(text).setFooter({ text: '⚠️ This message is fake / not real' })] });
  },
});

module.exports = [...meters, ship, rps, choose, eightball, wyr, wanted, tweet, fakemessage];
