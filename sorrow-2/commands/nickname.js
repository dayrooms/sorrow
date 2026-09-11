
const{ EmbedBuilder,PermissionFlagsBits } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'nickname',
	description: 'change mentioned users nickname',
	aliases:[],
	usage: '\```YAML\n\n nickname {user} jamal \```` ',
  category: "moderation",
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
        .setDescription(`${xmark} You're missing \`MANAGE_MESSAGES\` permission`)
        .setColor(error)
       let imissperms = new EmbedBuilder()
        .setDescription(`${xmark}  i don't have perms`)
        .setColor(error)
       let example = new EmbedBuilder()
       .setDescription(`${xmark} you need to provide a [User/ID]`)
       .setColor(error)
       let invaliduser = new EmbedBuilder()
       .setDescription(`${xmark} Invalid user`)
       .setColor(error)

       let higherrole = new EmbedBuilder()
       .setDescription(`${xmark} Can't reanme user with higher role than yours`)
       .setColor(error)
    
    
              if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))  return message.reply({ embeds:[missperms]});
          if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds:[imissperms]});
            

          let mentionedMember = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) || client.users.cache.get(args[0])

          if (!args[0]) return message.reply({ embeds: [example]})
          if (!mentionedMember) return message.reply({ embeds:[invaliduser]})
          if (message.member.roles.highest.comparePositionTo(mentionedMember.roles.highest) <= 0) return message.reply({ embeds:[higherrole]})
       let nick = args.splice(1).join(' ')
         mentionedMember.setNickname(nick)
        message.reply({embeds:[
          new EmbedBuilder()
          .setDescription(`${checked} Renamed ${mentionedMember.user.username} to ${nick}`)
          .setColor(color)
        ]})

         
	}
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};