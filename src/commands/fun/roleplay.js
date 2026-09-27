const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base, error } = require('../../utils/embed');
const { resolveMember } = require('../../utils/resolve');

/**
 * Roleplay actions. GIFs come from the keyless nekos.best API when reachable;
 * if the host blocks egress, we still send the action text (no crash).
 * Sexual actions require an age-restricted (NSFW) channel.
 */
const ACTIONS = {
  // wholesome (any channel)
  kiss: { verb: 'kissed', ep: 'kiss' }, hug: { verb: 'hugged', ep: 'hug' }, pat: { verb: 'patted', ep: 'pat' },
  cuddle: { verb: 'cuddled', ep: 'cuddle' }, poke: { verb: 'poked', ep: 'poke' }, tickle: { verb: 'tickled', ep: 'tickle' },
  slap: { verb: 'slapped', ep: 'slap' }, bite: { verb: 'bit', ep: 'bite' }, punch: { verb: 'punched', ep: 'punch' },
  highfive: { verb: 'high-fived', ep: 'highfive' }, wink: { verb: 'winked at', ep: 'wink' }, wave: { verb: 'waved at', ep: 'wave' },
  blush: { verb: 'blushed at', ep: 'blush' }, cry: { verb: 'cried on', ep: 'cry' }, dance: { verb: 'danced with', ep: 'dance' },
  feed: { verb: 'fed', ep: 'feed' }, handhold: { verb: 'held hands with', ep: 'handhold' }, nuzzle: { verb: 'nuzzled', ep: 'nuzzle' },
  smile: { verb: 'smiled at', ep: 'smile' }, pout: { verb: 'pouted at', ep: 'pout' }, stare: { verb: 'stared at', ep: 'stare' },
  yeet: { verb: 'yeeted', ep: 'yeet' }, laugh: { verb: 'laughed at', ep: 'laugh' }, nod: { verb: 'nodded at', ep: 'nod' },
  kill: { verb: 'playfully killed', ep: 'kick' }, shoot: { verb: 'shot', ep: 'shoot' }, bonk: { verb: 'bonked', ep: 'bonk' },
  boop: { verb: 'booped', ep: 'poke' }, greet: { verb: 'greeted', ep: 'wave' }, fistbump: { verb: 'fist-bumped', ep: 'highfive' },
  tackle: { verb: 'tackled', ep: 'glomp' }, cookie: { verb: 'gave a cookie to', ep: 'happy' }, run: { verb: 'ran away from', ep: 'run' },
  bully: { verb: 'bullied', ep: 'bully' }, nyah: { verb: 'nyah-ed at', ep: 'nom' },
  // sexual (NSFW channel required)
  fuck: { verb: 'fucked', ep: 'kiss', nsfw: true }, spank: { verb: 'spanked', ep: 'spank', nsfw: true },
  choke: { verb: 'choked', ep: 'slap', nsfw: true }, whip: { verb: 'whipped', ep: 'slap', nsfw: true }, lick: { verb: 'licked', ep: 'lick', nsfw: true },
};

async function fetchGif(ep) {
  try {
    const res = await fetch(`https://nekos.best/api/v2/${ep}`);
    if (!res.ok) return null;
    const d = await res.json();
    return d.results?.[0]?.url || null;
  } catch {
    return null;
  }
}

function makeAction(name, def) {
  return new Command({
    name, category: 'fun', description: `${name} someone.`, permLevel: LEVELS.USER, usage: '<member>',
    async run({ message, args }) {
      if (def.nsfw && !message.channel.nsfw) return message.reply({ embeds: [error('That action only works in an age-restricted (NSFW) channel.')] });
      const target = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first();
      if (!target) return message.reply({ embeds: [error('Mention someone.')] });
      const gif = await fetchGif(def.ep);
      const e = base().setDescription(`**${message.author.username}** ${def.verb} **${target.username}**!`);
      if (gif) e.setImage(gif);
      return message.channel.send({ embeds: [e] });
    },
  });
}

const commands = Object.entries(ACTIONS).map(([name, def]) => makeAction(name, def));

// interact <action> <member> wrapper
const interact = new Command({
  name: 'interact', category: 'fun', description: 'Roleplay with a member.', permLevel: LEVELS.USER, usage: '<action> <member>',
  async run({ message, args, prefix }) {
    const action = (args[0] || '').toLowerCase();
    const def = ACTIONS[action];
    if (!def) return message.reply({ embeds: [error(`Unknown action. Try: ${Object.keys(ACTIONS).slice(0, 20).join(', ')}...`)] });
    if (def.nsfw && !message.channel.nsfw) return message.reply({ embeds: [error('That action requires an NSFW channel.')] });
    const target = (await resolveMember(message.guild, args[1]))?.user || message.mentions.users.first();
    if (!target) return message.reply({ embeds: [error('Mention someone.')] });
    const gif = await fetchGif(def.ep);
    const e = base().setDescription(`**${message.author.username}** ${def.verb} **${target.username}**!`);
    if (gif) e.setImage(gif);
    return message.channel.send({ embeds: [e] });
  },
});

module.exports = [...commands, interact];
