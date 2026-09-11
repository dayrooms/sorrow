
const{ EmbedBuilder,ButtonBuilder,ActionRowBuilder,ButtonStyle,ChannelType,GuildPremiumTier } = require("discord.js");
const axios = require('axios')
const ms = require('moment')
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'serverinfo',
	description: 'returns servers info ',
	aliases:["sinfo"],
	usage: '\```YAML\n\n serverinfo \``` ',
  category: "information",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
         let emoji = `• `;
    //let levelemoji = `🚀 `;
            if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {
       
        if (message.guild.premiumTier === GuildPremiumTier.Tier1) {
          let levelemoji = `🚀 `;
        }
      else if (message.guild.premiumTier === GuildPremiumTier.Tier2) {
        let levelemoji = `🚀 `;
      } else if (message.guild.premiumTier === GuildPremiumTier.Tier3) {
        let levelemoji = `🚀 `;
      } let levelemoji = `•`
         let x = message.guild.vanityURLCode 
         let vanity =  'discord.gg/' + message.guild.vanityURLCode 
         if(x == null) vanity = `No vanity`
         
    const verificationLevels = {
      NONE: 'None',
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      VERY_HIGH: 'Highest'
    };  
          
                let embed = new EmbedBuilder()
        .setAuthor({name:`${message.guild.name} `})
        .setThumbnail(message.guild.iconURL({dynamic:true}))
        .setColor(color)
        .setFooter({text:`${message.guild.id}`})
        .addFields({
            name:`Owner`,
            value:`${emoji} ${client.users.cache.get(message.guild.ownerId).tag} \n **ID** (\`${message.guild.ownerId}\`) `,
            inline:true
        },
        {
          name:`Server Created`,
          value:`${emoji} ${ms(message.guild.createdAt).fromNow()} `,
          inline: true,
         },
      {
        name:`Roles`,
        value: `${emoji} ${message.guild.roles.cache.size}  `,
        inline:true,
    },

        {
            name:`Members`,
            value: `${emoji} **Total ${message.guild.memberCount}** \n${emoji} Users ${message.guild.memberCount -  message.guild.members.cache.filter(member => member.user.bot).size} \n${emoji} Bots ${message.guild.members.cache.filter(member => member.user.bot).size} `,
            inline: true,
        },
        {
            name:`Boost`,
            value:`${emoji} Level ${String(message.guild.premiumTier)} \n${emoji} Boosts ${message.guild.premiumSubscriptionCount} `,
            inline: true,
        },

        {
          name:`Channels`,
          value: `${emoji} Text ${message.guild.channels.cache.filter(channel => channel.type == ChannelType.GuildText).size} \n${emoji} Voice ${message.guild.channels.cache.filter(channel => channel.type == ChannelType.GuildVoice).size}\n${emoji} Categories ${message.guild.channels.cache.filter(channel => channel.type == ChannelType.GuildCategory).size}`,
          inline: true,
      },
        
        {
          name:`Emotes`,
          value: `${emoji} Emojis ${message.guild.emojis.cache.size} \n${emoji} Stickers ${message.guild.stickers.cache.size} `,
          inline:true,
      },
                  
        )
                
        const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
          .setLabel('icon')
          .setEmoji("🔗")
          .setURL(`${message.guild.iconURL({dynamic:true,size:4096})}`)
          .setStyle(ButtonStyle.Link),
         )
                const data = await axios.get(`https://discord.com/api/guilds/${message.guild.id}`, {
            headers:{
              Authorization:`Bot ${client.token}`
            }
          }).then(d => d.data);
          if(data.banner){
            let url = data.banner.startsWith("a_")?".gif?size=4096":".png?size=4096";
            url = `https://cdn.discordapp.com/banners/${message.guild.id}/${data.banner}${url}`
      

          


       if(url) row.addComponents(
         new ButtonBuilder()
         .setLabel('banner')
         .setEmoji("🔗")
         .setURL(`${url}`)
         .setStyle(ButtonStyle.Link),
        )
          
         if(message.guild.splashURL()) row.addComponents(
         new ButtonBuilder()
         .setLabel('splash')
         .setEmoji("🔗")
         .setURL(`${message.guild.splashURL({extension:"png",forceStatic:true,size:4096})}`)
         .setStyle(ButtonStyle.Link),
        ) 

      



      /*
        let embed = new EmbedBuilder()
        .setDescription(`${message.guild.name} \n • ${message.guild.description}`)
        .setThumbnail(message.guild.iconURL({dynamic:true}))
        .setColor(color)
        .setFooter({text:`${message.guild.id}`})
        .addFields({
            name:`Vanity`,
            value: `ℹ️ ${vanity}`,
            inline: true,
          
        },
        {
            name:`Members`,
            value: `👥 ${message.guild.memberCount}`,
            inline: true,
        },{
            name:`Roles`,
            value:`🎭  ${message.guild.roles.cache.size}`,
            inline: true,
        },
        {
            name:`Channels`,
            value: `💬 ${message.guild.channels.cache.size}`,
            inline: true,
        },
                {
            name:`Security`,
            value: `🛡️  ${verificationLevels[message.guild.verificationLevel]}`,
            inline:true,
        },
        {
            name:`Server Owner`,
            value: `👑  <@${message.guild.ownerId}>`,
            inline:true,
        },
        {
            name:`Server Created At`,
            value:`🕒  ${message.guild.createdAt.toDateString()}`,
            inline: true,
        },
        {
            name:`Booster Count`,
            value: ` ${emoji} 🚀 Level ${message.guild.premiumTier.replace('TIER_', '' && 'NONE','0')} \n ${emoji} 🚀  Boosts ${message.guild.premiumSubscriptionCount}`,
            inline: true,
        },

        {
            name:`Emojis`,
            value: `😀  ${message.guild.emojis.cache.size} `,
            inline:true,
        },
                  
        ) */

        message.reply({embeds:[embed],components:[row]});

      
          
	}else return message.reply({embeds:[embed]})
          
  //  } else return  message.reply({embeds:[embed],components:[row]})
          

    } 
                                                
                                                
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};