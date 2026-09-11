
const{ EmbedBuilder,PermissionFlagsBits } = require('discord.js');
const { default_prefix ,color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'xp',
	description: 'enable or disable xp system',
	aliases:[],
	usage: '\```joinlock [on/off] \```',
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
    const db = client.db;

        if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {
     
      let missperms = new EmbedBuilder()
      .setDescription(`⚠️ You're missing \`MANAGE_GUILD\` permission`)
       .setColor(error)
 if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds:[missperms]});
   
      
      if(args[0] === 'on'){
        await db.set(`xp_${message.guild.id}`,true)
        message.reply({embeds:[
          new EmbedBuilder()
          .setDescription(`${checked} **XP** is now enabled`)
          .setColor(color)
        ]})
      }
      else if(args[0] === 'off'){
        await db.delete(`xp_${message.guild.id}`)
         message.reply({embeds:[
          new EmbedBuilder()
          .setDescription(`${checked} **XP** is now disabled`)
          .setColor(color)
        ]})
      }

        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};