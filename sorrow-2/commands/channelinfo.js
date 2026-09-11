
const{ EmbedBuilder, ChannelType } = require('discord.js');
const moment = require('moment')
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'channelinfo',
	description: 'get info about the mentioned channel',
	aliases:['cinfo','chaninfo'],
	usage: '\``` channelinfo {#channel} \```',
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

       let emoji = `↳ `;
      let channel = message.mentions.channels.first() || message.channel
     const style = 'R' 
    const starttime = `<t:${Math.floor(channel.createdAt/1000)}` + (style ? `:${style}` : '') + '>'
      const channelTypeNames = {
        [ChannelType.GuildText]: 'text',
        [ChannelType.GuildVoice]: 'voice channel',
        [ChannelType.GuildCategory]: 'category channel',
        [ChannelType.GuildAnnouncement]: 'announcement channel',
        [ChannelType.GuildStageVoice]: 'stage channel',
        [ChannelType.GuildForum]: 'forum channel',
      };
      let channelTypeName = channelTypeNames[channel.type] || channel.type.toString();
      let embed = new EmbedBuilder()
      .setDescription(`Channel Info 💬 `)
      .setColor(color)
      .addFields(
        {
          name:`Name`,
          value:`${channel.name}`,
          inline:true
        },
        {
          name:`Type`,
          value:`${emoji} ${channelTypeName}`,
          inline:true
        },
        {
          name:`Channel ID`,
          value:`${emoji} ${channel.id}`,
          inline:true
        },
        {
          name:`Created At`,
          value:`${emoji} ${starttime}`,
          inline:true
        },
        {
          name:`Category`,
          value:`${emoji} ${channel.parent ? channel.parent.name : 'None'}`,
          inline:true
        },
        {
          name:`Topic`,
          value:`${emoji} ${channel.topic || 'None'}`,
          inline:true
        }
      )
      message.reply({embeds:[embed]})


        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};