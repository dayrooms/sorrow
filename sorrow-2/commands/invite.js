
const{ EmbedBuilder,ActionRowBuilder,ButtonBuilder } = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'invite',
	description: 'returns bot direct invite',
	aliases:[],
	usage: '\```YAML\n\n invite \``` ',
  category: "information",
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
             const row = new ActionRowBuilder()
        .addComponents(
         new ButtonBuilder()
         .setLabel('Invite Me!')
         .setEmoji(`🔗 `)
         .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
         .setStyle(ButtonStyle.Link),
        )

          let embed = new EmbedBuilder()
        .setTitle(`Sorrow`)
        .setDescription(`👋  Sorrow Security & Multipurpose \n> Guilds \`${client.guilds.cache.size}\` \n> Users \`${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}\``)
        .setColor(color)
        message.reply({embeds:[embed],components:[row]});

        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};