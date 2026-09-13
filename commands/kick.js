
const{ EmbedBuilder ,PermissionFlagsBits} = require('discord.js');
const { hasModPermission } = require("../utils/permissionCheck");
const { logCase } = require("../utils/caseLogger");
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'kick',
	description: 'kick mentioned user from the server',
	aliases:[],
	usage: '\```YAML\n\n kick @heist#0001 spamming \``` ',
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
        .setDescription(`${xmark}  You're missing \`KICK_MEMBERS\` permission`)
        .setColor(error)
       let imissperms = new EmbedBuilder()
        .setDescription(`${xmark}   i don't have perms`)
        .setColor(error)
       let example = new EmbedBuilder()
       .setDescription(`kick <<member>> \n example: kick <<@heist#0001>>`)
       .setColor(color)
       let banyou = new EmbedBuilder()
       .setDescription(`${xmark}   You can't kick yourself`)
       .setColor(error)
       let invaliduser = new EmbedBuilder()
       .setDescription(`${xmark}   Invalid user`)
       .setColor(error)
       let unbannable = new EmbedBuilder()
       .setDescription(`${xmark}   Can't kick that user`)
       .setColor(error)
       let higherrole = new EmbedBuilder()
       .setDescription(`${xmark}  Can't kick a user with higher role than yours`)
       .setColor(error)
    
    
              if (!(await hasModPermission(message.member, message.guild, db, PermissionFlagsBits.KickMembers)))  return message.reply({ embeds:[missperms]});
          if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply({ embeds:[imissperms]});
          let reason = args.slice(1).join(" ");
          let mentionedMember = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) || client.users.cache.get(args[0])
 
          let banned = new EmbedBuilder()
          .setDescription(`${checked}  Kicked ${mentionedMember.user.tag} `)
          .setColor(color)
      
          if (!reason) reason = 'No Reason Supplied';
            
          if (!args[0]) return message.reply({ embeds: [example]})
          if (mentionedMember.id == message.author.id) return message.reply({ embeds:[banyou]})
          if (!mentionedMember) return message.reply({ embeds:[invaliduser]})
          if (!mentionedMember.bannable) return message.reply({ embeds: [unbannable]})
          if (mentionedMember.roles.highest <=  message.member.roles.highest.position) return message.reply({ embeds:[higherrole]})
      
      
          await mentionedMember.kick(reason).catch(err => console.log(err)).then(async () => {
            await logCase(db, message.guild.id, 'Kick', mentionedMember.id, message.author.id, reason);
            message.reply({ embeds:[banned]});
          })
          }
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
        
      }