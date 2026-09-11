const{ EmbedBuilder } = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'serveravatar',
	description: 'returns user server avatar if they have one',
	aliases: ["sav"],
	usage: '\```sav @glory#0007',
  category: "utility",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async (message, args, client) => {
        
            if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {


      let mentionedMember = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) || client.users.cache.get(args[0])

        if(!mentionedMember) {
          let embed = new EmbedBuilder()
          .setImage((message.guild.members.cache.get(mentionedMember.user.id).displayAvatarURL({ extension: "png", size: 4096 })))
          .setFooter({ text: `${message.author.tag}`})
          .setColor(color)
          await message.reply({embeds:[embed]}).catch(() => {/*Ignore error*/})
  
        }else{
          let embed = new EmbedBuilder()
          .setImage((message.guild.members.cache.get(mentionedMember.user.id).displayAvatarURL({ extension: "png", size: 4096 })))
          .setFooter({ text: `${mentionedMember.user.tag}`})
          .setColor(color)
          await message.reply({embeds:[embed]}).catch(() => {/*Ignore error*/})
        }
	}
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};