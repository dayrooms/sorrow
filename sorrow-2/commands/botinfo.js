
const{EmbedBuilder, ActionRowBuilder ,ButtonBuilder,ButtonStyle} = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const os = require("os");
const moment = require("moment");
require("moment-duration-format");
const talkedRecently = new Set();
module.exports = {
	name: 'info',
	description: '\u200B',
	aliases:['botinfo'],
	usage: '\``` botinfo \```',
  category: "information",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client,files) => {
    const db = client.db;
                if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {
      

    
      let memoryUsage = `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100}MB`;
      const duration = moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]");
    const row = new ActionRowBuilder()
        .addComponents(
         new ButtonBuilder()
         .setLabel('Invite Me!')
          .setEmoji("🔗")
         .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
         .setStyle(ButtonStyle.Link),
        )
        .addComponents(
        )
         .addComponents(
         new ButtonBuilder()
         .setLabel('Privacy Policy!')
          .setEmoji("🔗")
         .setURL("https://nek0.gitbook.io/sorrow/details/privacy-policy")
         .setStyle(ButtonStyle.Link),
        )
 
        let embed = new EmbedBuilder()
        .setAuthor({name:`Sorrow Info`,iconURL:`${client.user.displayAvatarURL()}`})
        .setDescription('\```' + `Developed and maintained by ${client.users.cache.get('').tag}` + '\```')
        .addFields(
        {
          name:`Client`,
          value:`• Users ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} \n • Servers ${client.guilds.cache.size} \n • Commands ${client.commands.size} \n • Shard ${message.guild.shardId} \n • Ping ${client.ws.ping} \n • Commands Used ${await db.get('commandsused')} `,
          inline:true
        },
        {
          name:`Stats`,
          value:`• Memory Usage (${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}/${(require('os').totalmem() / 1024 / 1024).toFixed(2)}) \n • CPU Cores ${require('os').cpus().length} \n • Uptime ${duration}`,
          inline:true
        },

        )
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setColor(color)
        message.reply({ embeds: [embed], components: [row]});
      
	}
          talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};