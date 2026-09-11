
const{ EmbedBuilder, PermissionFlagsBits  } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'lock',
	description: 'locks mentioned channel',
	aliases:['lockdown'],
	usage: ' \``` lock \n lock #channel \``` ',
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
        .setDescription(`${xmark} You're missing \`MANAGE_GUILD\` permission`)
        .setColor(error)
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds:[missperms]});

          let channel = message.mentions.channels.first();

    if (channel) {
      let reason = args.join(' ').slice(22) || 'Not Specified';
    } else {
      channel = message.channel;
    }

    if (channel.permissionsFor(message.guild.id).has(PermissionFlagsBits.SendMessages) === false) {
      const lockchannelError2 = new EmbedBuilder()
        .setDescription(`⚠️  ${channel.name} is already locked!`)
        .setColor(error);

      return message.channel.send({ embeds: [lockchannelError2] });
    }

    channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false });

    const embeds = new EmbedBuilder()
      .setDescription(` 🔒 ${channel.name} locked `)
      .setColor(color);

    message.reply({embeds:[embeds]})
  }
      
      
      
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    

	},
};