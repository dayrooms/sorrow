const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { color, error } = require("../config.json");

const selfMessages = {
  hug: "hugs themselves 🤗", pat: "pats their own head", slap: "slaps themselves silly",
  kiss: "blows a kiss to the mirror", cuddle: "cuddles a pillow", poke: "pokes themselves",
  tickle: "tickles themselves", punch: "shadowboxes", bite: "bites their own arm",
  cry: "cries alone", dance: "dances solo", wave: "waves at no one", highfive: "high-fives the air",
  blush: "blushes at nothing", smile: "smiles to themselves", wink: "winks at their reflection",
  yeet: "yeets into the void", laugh: "laughs alone", nod: "nods to themselves",
  boop: "boops their own nose", feed: "feeds themselves", pout: "pouts alone",
  stare: "stares into the abyss", bonk: "bonks their own head", tackle: "tackles a pillow",
  handhold: "holds their own hand", nuzzle: "nuzzles a plushie", fistbump: "fistbumps the air",
  greet: "greets everyone",
};

/**
 * Builds a reaction-gif command using the free, no-key nekos.best API.
 * @param {string} action - the nekos.best endpoint (e.g. 'hug', 'pat')
 * @param {string} verb - human-readable present-tense verb for the embed text
 */
function buildInteractCommand(action, verb) {
  return {
    name: action,
    description: `${verb} another member`,
    aliases: [],
    usage: `;${action} @user`,
    category: "games",
    guildOnly: false,
    args: false,
    permissions: { bot: [], user: [] },
    execute: async (message, args, client) => {
      const target = message.mentions.users.first();

      let gifUrl = null;
      try {
        const res = await axios.get(`https://nekos.best/api/v2/${action}`);
        gifUrl = res.data && res.data.results && res.data.results[0] && res.data.results[0].url;
      } catch {}

      const embed = new EmbedBuilder().setColor(color);
      if (!target || target.id === message.author.id) {
        embed.setDescription(`${message.author} ${selfMessages[action] || `${verb}s themselves`}`);
      } else if (target.bot) {
        embed.setDescription(`${message.author} tried to ${verb} a bot. Bots don't have feelings... probably.`);
      } else {
        embed.setDescription(`${message.author} ${verb}s ${target}`);
      }
      if (gifUrl) embed.setImage(gifUrl);

      message.reply({ embeds: [embed] });
    },
  };
}

module.exports = { buildInteractCommand };
