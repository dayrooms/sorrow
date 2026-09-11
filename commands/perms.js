
const{ EmbedBuilder } = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const moment = require('moment');
const talkedRecently = new Set();
module.exports = {
	name: 'perms',
	description: 'returns a list of mentioned users permissions in the server',
	aliases:["permissions"],
	usage: ' \```YAML\n\n perms @heist#0001 \``` ',
  category: "information",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
         let emoji = `• `;
         let statusemoji = `🟢 `
        

            if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {
      try {

        let mentionedMember = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) || client.users.cache.get(args[0])

        let nickname = mentionedMember.nickname
        if (nickname) {
          nickname = `∙ ${mentionedMember.nickname}`;
        } else {
          nickname = mentionedMember.user.username
        }


        
        let embed = new EmbedBuilder()
        .setThumbnail(mentionedMember.user.displayAvatarURL({dynamic:true}))
        .setColor(color)
        .addFields({ name: `${mentionedMember.user.username} Permissions`, value: `${`${mentionedMember.permissions.toArray().sort((a, b) => a.localeCompare(b)).map(p=> `\`${p}\``).join(", ")}`}` })

        message.reply({embeds:[embed]});

      
      } catch{}
	}
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};