const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base, error } = require('../../utils/embed');
const db = require('../../database/db');

const WORDS = ['banana', 'guitar', 'rocket', 'planet', 'coffee', 'dragon', 'castle', 'wizard', 'jungle', 'thunder', 'diamond', 'penguin', 'volcano', 'compass', 'lantern'];

/** blacktea — type a word containing the given syllable before time runs out. */
const blacktea = new Command({
  name: 'blacktea',
  category: 'fun',
  description: 'Black tea word game.',
  permLevel: LEVELS.USER,
  usage: 'start | end',
  async run({ client, message, prefix, sub }) {
    client._blacktea = client._blacktea || {};
    if (sub === 'end') {
      delete client._blacktea[message.channel.id];
      return message.channel.send({ embeds: [base().setDescription('🫖 Black tea game ended.')] });
    }
    if (client._blacktea[message.channel.id]) return message.reply({ embeds: [error('A game is already running here.')] });

    const syllable = pickSyllable();
    client._blacktea[message.channel.id] = { syllable };
    await message.channel.send({ embeds: [base(0x2c2f33).setTitle('🫖 Black Tea').setDescription(`Type a word containing **${syllable.toUpperCase()}** within 15 seconds!`)] });

    const filter = (m) => m.content.toLowerCase().includes(syllable) && /^[a-z]+$/i.test(m.content.trim()) && m.content.trim().length > syllable.length;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 }).catch(() => null);
    delete client._blacktea[message.channel.id];
    if (collected?.size) {
      const winner = collected.first();
      const stats = db.getSettings(message.guild.id, 'blacktea', {});
      stats[winner.author.id] = (stats[winner.author.id] || 0) + 1;
      db.saveSettings(message.guild.id, 'blacktea', stats);
      return message.channel.send({ embeds: [base(0x57f287).setDescription(`✅ **${winner.author.username}** got it with **${winner.content.trim()}**!`)] });
    }
    return message.channel.send({ embeds: [base(0xed4245).setDescription(`⏰ Time's up! Nobody found a word with **${syllable.toUpperCase()}**.`)] });
  },
});

function pickSyllable() {
  const w = WORDS[Math.floor(Math.random() * WORDS.length)];
  const start = Math.floor(Math.random() * (w.length - 2));
  return w.slice(start, start + 2);
}

const flag = new Command({
  name: 'flag',
  category: 'fun',
  description: 'Guess the flag game.',
  permLevel: LEVELS.USER,
  usage: 'start',
  async run({ message, prefix, sub }) {
    const FLAGS = [
      { emoji: '🇯🇵', name: 'japan' }, { emoji: '🇫🇷', name: 'france' }, { emoji: '🇧🇷', name: 'brazil' },
      { emoji: '🇨🇦', name: 'canada' }, { emoji: '🇩🇪', name: 'germany' }, { emoji: '🇮🇳', name: 'india' },
      { emoji: '🇲🇽', name: 'mexico' }, { emoji: '🇰🇷', name: 'south korea' }, { emoji: '🇪🇬', name: 'egypt' },
      { emoji: '🇮🇹', name: 'italy' }, { emoji: '🇦🇺', name: 'australia' }, { emoji: '🇳🇬', name: 'nigeria' },
    ];
    const pick = FLAGS[Math.floor(Math.random() * FLAGS.length)];
    await message.channel.send({ embeds: [base().setTitle('🏳️ Guess the Flag').setDescription(`Which country? ${pick.emoji}\nYou have 15 seconds.`)] });
    const filter = (m) => m.content.toLowerCase().trim() === pick.name;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 }).catch(() => null);
    if (collected?.size) return message.channel.send({ embeds: [base(0x57f287).setDescription(`✅ **${collected.first().author.username}** got it — **${pick.name}**!`)] });
    return message.channel.send({ embeds: [base(0xed4245).setDescription(`⏰ It was **${pick.name}**.`)] });
  },
});

module.exports = [blacktea, flag];
