
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
                value:` ↳  \`1\` 👑  **${client.users.cache.get('').tag}** - Owner (\`${client.users.cache.get('').id}\`) \n ↳ \`2\` 👑 **${client.users.cache.get('').tag}** - Owner & Developer (\`${client.users.cache.get('').id}\`) \n ↳ \`3\` 👑 **${client.users.cache.get('').tag}** - Owner (\`${client.users.cache.get('').id}\`) \n ↳  \`4\` 👑 **${client.users.cache.get('').tag}** - Owner & Developer (\`${client.users.cache.get('').id}\`) \n ↳ \`5\` 👑 **${client.users.cache.get('').tag}** - Owner (\`${client.users.cache.get('').id}\`) \n`
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