
const{ EmbedBuilder,PermissionFlagsBits } = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'botclear',
	description: 'bulk delete bot messages',
	aliases:["bc"],
	usage: ' \```YAML\n\n botclear \``` ',
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
        .setDescription(`⚠️ You're missing \`MANAGE_MESSAGES\` permission`)
        .setColor(error)
       let imissperms = new EmbedBuilder()
        .setDescription(`⚠️  i don't have perms`)
        .setColor(error)
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({embds:[missperms]});
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({embeds:[imissperms]});

    try {
      message.channel.messages.fetch().then(messages => {
        const botMessages = messages.filter(msg => msg.author.bot);
        message.channel.bulkDelete(botMessages).catch(() => {})
      });
    } catch (err) {
      return;
    }
    message.delete().catch(() => {})

    let botClearEmbed = new EmbedBuilder()
      .setColor(color)
      .setDescription(`✅  cleared bot messages`)
    message.channel.send({ embeds: [botClearEmbed] }).then(m => m.delete(800000));
   
	}
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};