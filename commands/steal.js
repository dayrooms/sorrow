
const{ EmbedBuilder,PermissionFlagsBits,parseEmoji } = require('discord.js');
const Discord = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'steal',
	description: 'create multiple emojis at once',
	aliases:["createemoji"],
	usage: '\```YAML\n\n steal {emojis} \```',
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
          const getEmoji = parseEmoji(args[0]);
                if (getEmoji.id) {
        const emojiExt = getEmoji.animated ? '.gif' : '.png';
        const emojiURL = `https://cdn.discordapp.com/emojis/${getEmoji.id + emojiExt}`;
        await message.guild.emojis
          .create({ attachment: emojiURL, name: getEmoji.name })
        let x = new EmbedBuilder()
      .setDescription(`${checked} Created Emote ${args[0]}`)
       .setColor(color)
       return message.reply({embeds:[x]})
      }

             message.react(`⌛`)
    } else {

        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))  return message.reply({ embeds:[missperms]});
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds:[imissperms]});
      
      
          if (!args[0]) {
      const emojiEmbed = new EmbedBuilder()
        .setDescription(`addemote <<emote>> \n example createmote 🙏 `)
        .setColor(color)
      if (!args[0]) return message.reply({embeds:[emojiEmbed]})
    }
     if(args[51]) {
       let too = new EmbedBuilder()
       .setDescription(`${xmark} You can't create more than 50 emojis`)
       .setColor(error)
       return message.reply({embeds:[too]})
     }
      let emojiss = new Array();
    for (const emojis of args) {
      const getEmoji = parseEmoji(emojis);

      if (getEmoji.id) {
        const emojiExt = getEmoji.animated ? '.gif' : '.png';
        const emojiURL = `https://cdn.discordapp.com/emojis/${getEmoji.id + emojiExt}`;
        await message.guild.emojis
          .create({ attachment: emojiURL, name: getEmoji.name })
          .then((emoji) => (
          emojiss.push(emoji)
        ))
      }
    }
        let help = new EmbedBuilder()
        .setDescription(`${checked} Succesfully Created ${emojiss.length} emojis `)
        .setColor(color)
    await message.reply({embeds:[help]});
    


      
      
      
      
      
      
      
      
      
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id),
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 900000);
    }


	},
};
