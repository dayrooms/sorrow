
const{ EmbedBuilder,ButtonBuilder,ActionRowBuilder,ButtonStyle } = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'avatar',
	description: 'returns mentioned user profile picture',
	aliases: ["av",'pfp'],
	usage: ' \```YAML\n\n avatar {heist#0001} \``` ',
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

  
        
        

      let mentionedMember = await message.mentions.members.first() || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ')) || client.users.cache.find(r => r.tag === args.join(' ')) || client.users.cache.get(args[0]) || message.member

  
try {
         const row = new ActionRowBuilder()
        .addComponents(
         new ButtonBuilder()
         .setLabel('webp')
          .setEmoji("🔗")
         .setURL(`${mentionedMember.displayAvatarURL({extension: "webp", size: 4096})}`)
         .setStyle(ButtonStyle.Link),
        )
        .addComponents(
         new ButtonBuilder()
         .setLabel('jpg')
          .setEmoji("🔗")
           .setURL(`${mentionedMember.displayAvatarURL({extension: "jpg", size: 4096})}`)
         .setStyle(ButtonStyle.Link),
        )
        .addComponents(
         new ButtonBuilder()
         .setLabel('png')
          .setEmoji("🔗")
          .setURL(`${mentionedMember.displayAvatarURL({extension: "png", size: 4096})}`)
           .setStyle(ButtonStyle.Link),
          )
         
          let embed = new EmbedBuilder()
          .setImage((mentionedMember.displayAvatarURL({ extension: "png", size: 4096 })))
          .setFooter({ text: `${mentionedMember.user.tag}`})
          .setColor(color)
          await message.reply({embeds:[embed] , components: [row]}).catch(() => {/*Ignore error*/})
        }catch{
        
            const row = new ActionRowBuilder()
      .addComponents(
       new ButtonBuilder()
       .setLabel('webp')
        .setEmoji("🔗")
       .setURL(`${message.author.displayAvatarURL({extension: "webp", size: 4096})}`)
       .setStyle(ButtonStyle.Link),
      )
      .addComponents(
       new ButtonBuilder()
       .setLabel('jpg')
        .setEmoji("🔗")
         .setURL(`${message.author.displayAvatarURL({extension: "jpg", size: 4096})}`)
       .setStyle(ButtonStyle.Link),
      )
      .addComponents(
       new ButtonBuilder()
       .setLabel('png')
        .setEmoji("🔗")
        .setURL(`${message.author.displayAvatarURL({extension: "png", size: 4096})}`)
       .setStyle(ButtonStyle.Link),
      )
        let embed = new EmbedBuilder()
        .setImage((message.author.displayAvatarURL({ extension: "png", size: 4096 })))
        .setFooter({ text: `${message.author.tag}`})
        .setColor(color)
        await message.reply({embeds : [embed] , components: [row]}).catch(() => {/*Ignore error*/})

      
        }
	}
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};