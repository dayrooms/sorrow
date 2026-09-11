
const{ EmbedBuilder,PermissionFlagsBits,ActionRowBuilder,ButtonBuilder,ButtonStyle } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'nuke',
	description: 'deletes current channel and clones it',
	aliases:["clone"],
	usage: ' \```YAML\n\n nuke [#channel] \```',
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
        .setDescription(`${xmark} You're missing \`MANAGE_CHANNELS\` permission`)
         .setColor(color)
               let imissperms = new EmbedBuilder()
        .setDescription(`⚠️  i don't have perms`)
        .setColor(error)
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply({ embeds:[imissperms]});
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))  return message.channel.send({ embeds:[missperms]});
          const row = new ActionRowBuilder().addComponents(
             new ButtonBuilder()
              .setCustomId('yes')
              .setEmoji("✅")
              .setStyle(ButtonStyle.Secondary),
            
            new ButtonBuilder()
              .setCustomId('no')
              .setEmoji("❌")
              .setStyle(ButtonStyle.Secondary)
          )
          let msg = message.reply({embeds:[
            new EmbedBuilder().setDescription(`Are you sure you want to nuke this channel?.`).setColor(color)
          ],
                         components:[row]
                        }).then(m => {
            if(!m) return;
            setTimeout(() => { m.delete().catch(()=> {})},3500)
          }).catch(() => { /* */})
         // const filter = (i) => {
        //    if(i.author.id === message.author.id) return true
        //  }
          
          const collector = message.channel.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            max:1
          })
          
          collector.on("end", (ButtonInteraction) => {
           
            const id = ButtonInteraction.first().customId;
            if(id === 'yes') {
             let embed = new EmbedBuilder()
          .setDescription(`${checked} Channel Nuked by ${message.author.tag}`)
          .setColor(color)
          message.channel.clone().then(channel => {
              //channel.setPosition(message.channel.position)
              channel.send({embeds:[embed]})
          })
          message.channel.delete().catch(() => {/*Ignore error*/})
            }
            if(id === 'no') {
                           let embed = new EmbedBuilder()
          .setTitle(`Canceled`)
          .setColor(color)
            message.channel.send({embeds:[
              new EmbedBuilder().setDescription(`${checked} Succesfully Canceled`).setColor(color)
            ]})
            }
          })
          
          
          
          /*
          let embed = new EmbedBuilder()
          .setTitle(`${checked} Channel Nuked by ${message.author.tag}`)
          .setColor(color)
          message.channel.clone().then(channel => {
              //channel.setPosition(message.channel.position)
              channel.send({embeds:[embed]})
          })
         // message.channel.delete().catch(() => {/*Ignore error*/ //}) 
          // */
	}
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};