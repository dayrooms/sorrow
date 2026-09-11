
const{ EmbedBuilder,PermissionFlagsBits,parseEmoji } = require('discord.js');
const Discord = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'sticker',
	description: 'create a sticker',
	aliases:[],
	usage: '\```YAML\n\n sticker {emoji} \```',
  category: "utility",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
        let missperms = new EmbedBuilder()
        .setDescription(`${xmark} You're missing perms`)
        .setColor(error)
        let imissperms = new EmbedBuilder()
        .setDescription(`${xmark}  i don't have perms`)
        .setColor(error)


        if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {
      if(args[0] === 'steal'){
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))  return message.reply({ embeds:[missperms]});
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds:[imissperms]});
      
        const getSticker= parseEmoji(args[1]);
        if (getSticker.id) {
const stickerExt = getSticker.animated ? '.gif' : '.png';
const stickerURL = `https://cdn.discordapp.com/emojis/${getSticker.id + stickerExt}`;
await message.guild.stickers
  .create({ file: stickerURL, name: getSticker.name, tags: message.guild.name })
let x = new EmbedBuilder()
.setDescription(`${checked} Created Sticker ${getSticker.name}`)
.addFields({
  name:`ID`,
  value:`${getSticker.id}`,
},
{
  name:`Name`,
  value:`${getSticker.name}`
}
)
.setImage(stickerURL)
.setColor(color)
return message.reply({embeds:[x]})
  }
      }else if(args[0] === 'add'){
            try {
                   await message.guild.stickers
     .create({ file: args[1], name: message.author.username, tags: message.guild.name })
        let x = new EmbedBuilder()
         .setDescription(`${checked} Created Sticker `)
         .setImage(args[1])
         .setColor(color)
      return message.reply({embeds:[x]})
    } catch (e) {
         message.reply({
          embeds:[
            {
              description:`${e.message}`,
              color:error
            }
          ]
         })
    }
        

      
        
      }
      
      
      
      
      
      
      
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id),
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 900000);
    }


	},
};
