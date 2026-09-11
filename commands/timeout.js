
const{ EmbedBuilder,PermissionFlagsBits } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'timeout',
	description: 'mutes or unmutes mentioned user',
	aliases:["mute","deaf"],
	usage: ' \```YAML\n\n mute @heist#0001 SHUT UP \``` ',
  category: "moderation",
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
              let missperms = new EmbedBuilder()
    .setDescription(`${xmark} You're missing \`MANAGE_MESSAGES\` permission`)
    .setColor(error)
   let imissperms = new EmbedBuilder()
    .setDescription(`${xmark} i don't have perms`)
    .setColor(error)
          let invaliduser = new EmbedBuilder()
       .setDescription(`${xmark} Invalid user`)
       .setColor(error)
       let higherrole = new EmbedBuilder()
       .setDescription(`${xmark} Can't mute a user with higher role than yours`)
       .setColor(error)
   
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))  return message.reply({ embeds:[missperms]});
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds:[imissperms]});
       
      

        let member = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) || client.users.cache.get(args[0])
  
      if(!member) return message.reply({ embeds:[invaliduser]})
      if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return message.reply({ embeds:[higherrole]})
      let help = new EmbedBuilder()
      .setDescription(`${xmark} Provide an user to [timeout/removetimeout]`)
      .setColor(error)
      let cant = new EmbedBuilder()
      .setDescription(`${xmark} I can't access that user`)
      .setColor(error)
               let one = new EmbedBuilder()
          .setDescription(`${checked}  User has been Timedout`)
          .setColor(color)
                        let done = new EmbedBuilder()
          .setDescription(`${checked}  User has been Removed from Timeout`)
          .setColor(color)
      if (!member) {
        message.reply({embeds:[help]})
      } 
      if (!member.manageable) {
        message.reply({embeds:[cant]})
      } else {
        if (member.isCommunicationDisabled()) {
          member.timeout(null);
         message.reply({embeds:[done]})
        } else {
        member.timeout(10000000);
        message.reply({embeds:[one]})
        }
      }
    

      
      
      
      
      
      
      
    
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id),
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }


	},
};