
const{ EmbedBuilder, parseEmoji } = require('discord.js');
const moment = require('moment')
const { default_prefix ,color,error,owner,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'emoteinfo',
	description: 'get info about an emote',
	aliases:[],
	usage: '\``` emojiinfo 🙈\```',
  category: "information",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
        if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {

       let emoji = `↳ `;
        // let emote =  client.emojis.cache.get(args[2].match(/<:.*:(.*)>/)[1])
      let emote = parseEmoji(args[0]);
      if(!emote) return message.reply({embeds:[new EmbedBuilder().setDescription(`${xmark} I couldn't find that emoji `).setColor(error)]})
     const style = 'R' 
    const starttime = `<t:${Math.floor(emote.createdAt/1000)}` + (style ? `:${style}` : '') + '>'
        const emojiExt = emote.animated ? '.gif' : '.png';
        const emojiURL = `https://cdn.discordapp.com/emojis/${emote.id + emojiExt}`;
      let embed = new EmbedBuilder()
      .setDescription(`Emoji Info `)
      .setColor(color)
      .addFields(
        {
          name:`Name`,
          value:`${emote.name}`,
          inline:true
        },
        {
          name:`Animated`,
          value:`${emoji} ${emote.animated ? 'Yes' : 'No'}`,
          inline:true
        },
        {
          name:`Emote ID`,
          value:`${emoji} ${emote.id}`,
          inline:true
        },
        {
          name:`Created At`,
          value:`${emoji} ${moment.utc(emote.createdAt).format('MM/DD/YYYY h:mm A')}`,
          inline:true
        },

      )
      .setThumbnail(emojiURL)
      message.reply({embeds:[embed]})


        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};