
const{ EmbedBuilder } = require('discord.js');
const { default_prefix ,color,error,owner,xmark } = require("../config.json")
const parse = require('../regex.js')
const talkedRecently = new Set();
module.exports = {
	name: 'credits',
	description: 'Bot Owners & staff',
	aliases:[],
	usage: '\```credits\```',
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
      
      
         let embed = new EmbedBuilder()
         .setAuthor({name:`Sorrow `})
         .addFields(
            {
                name:`**Owners**`,
                value:` ↳  👑  **<@${owner}>** - Owner (\`${owner}\`)`
            }
         )
         .setThumbnail(client.user.displayAvatarURL({size:4096}))
         .setColor(color)
         message.reply({embeds:[embed]})

      
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};