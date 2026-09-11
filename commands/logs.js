
const{ EmbedBuilder,PermissionFlagsBits } = require('discord.js');
const { default_prefix ,color,error,owner,xmark } = require("../config.json")
module.exports = {
	name: 'logs',
	description: 'log everything that happens in the server',
	aliases:[],
	usage: '\``` logs channel {#channel} \```',
  category: "moderation",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
    const db = client.db;
       /*if(args[0]) {
        let chx = await db.get(`antinukelogs_${message.guild.id}`);
        if (chx == null) {
          return message.channel.send({ content:`There is no antinukelogs channel set`})
        }
        else return message.channel.send({content:`antinukelogs is set to <#${chx}>`})
       }
        else */
              let missperms = new EmbedBuilder()
    .setDescription(`${xmark} You're missing \`MANAGE_GUILD\` permission`)
    .setColor(error)
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds:[missperms]});

           if(!args[0]) {
            let embed = new EmbedBuilder()
            .setDescription(`Sorrow Logs `)
            .addFields(
              {
                name:`Usage`,
                value:`↳ ${default_prefix}logs channel <#${message.channel.id}> \n↳ ${default_prefix}logs clear`,
                
              },

            )
            .setColor(color)
            message.reply({embeds:[embed]})
            
           }else 
           if (args[0] == "channel") {
            let channel = message.mentions.channels.first()
            if (!channel) {
              const welcomechannel = new EmbedBuilder()
              .setDescription(`set the channel for server logs \n> logs channel #channel`)
              .setColor(color)
              return message.channel.send({embeds:[welcomechannel]})
            }
            await db.set(`logs_${message.guild.id}`, channel.id)
            await message.channel.send({content:`Set the logs channel to ${channel}`})
          }  else if (args[0] == 'test') {
            let chx = await db.get(`logs_${message.guild.id}`);
            if (chx == null) {
              return message.channel.send({ content:`There is no logs channel set`})
            }
            client.channels.cache.get(chx).send({content:`${message.author} hi`})
            message.channel.send({ content:`Tested logs in <#` + chx + `>` })
            if (chx == null) {
              return message.channel.send({ content:`There is no logs channel set`})
            }
          }else if (args[0] == 'clear') {
            await db.delete(`logs_${message.guild.id}`)
            message.channel.send({content:`removed logs`})

          }
	},
};