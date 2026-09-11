
const{ EmbedBuilder } = require('discord.js');
const parse = require('../regex.js')
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'boost',
	description: 'replies to new boosters with custom message',
	aliases:['boostevent','booster'],
	usage: ' \``` boost channel {channel.id} \n boost message {msg} \n boost clear \n boost stats \``` ',
  category: "config",
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
      let emoji = `↳ `
      if(!args[0]){
        let embed = new EmbedBuilder()
        .setDescription(`**Booster Commands** \n ↳ boost message {message}\n ↳ boost channel {#channel} \n ↳ boost variables \n ↳ boost clear `)
        .setColor(color)
        return message.reply({embeds:[embed]})
        }
      if(args[0] === 'channel'){
     let channel = message.mentions.channels.first()
      if (!channel) return message.reply({embeds:[new EmbedBuilder().setDescription(`${xmark} Mention a valid channel`).setColor(error)]});
       message.reply({embeds:[new EmbedBuilder().setDescription(`${checked} Set the boosters channel to <#${channel.id}>`).setColor(color)]});
       await db.set(`boostchan_${message.guild.id}`, channel.id)
      }else if(args[0] === 'message'){
        message.reply({embeds:[new EmbedBuilder().setDescription(`${checked} updated boosters message`).setColor(color)]});
        await db.set(`boostmsg_${message.guild.id}`, args.splice(1).join(' '))
      }else if(args[0] === 'clear'){
        message.reply({embeds:[new EmbedBuilder().setDescription(`${checked} Cleared boosters setup from database`).setColor(color)]});
        await db.delete(`boostchan_${message.guild.id}`)
        await db.delete(`boostmsg_${message.guild.id}`)
        
      }else if(args[0] === 'variables'){
        let embed = new EmbedBuilder()
        .setDescription(`**Booster Variables** 🚀  \n ↳  {user} - ${message.member} \n ↳ {user.name} - ${message.author.username} \n ↳ {user.tag} - ${message.author.tag} \n ↳ {user.id} - ${message.author.id} \n ↳ {boostcount} - ${message.guild.premiumSubscriptionCount} \n ↳ {levelcount} - ${String(message.guild.premiumTier)} \n ↳ {guild.name} - ${message.member.guild.name} \n ↳ {guild.id} - ${message.member.guild.id}`)
        .setColor("#f47fff")
        message.reply({embeds:[embed]})
        }
      else if(args[0] == 'stats'){
             let chx = await db.get(`boostchan_${message.guild.id}`);
      if (chx) chx = `<#${chx}>`
      else if (chx === null) chx = `Not Set`
            let welcome = await db.get(`boostmsg_${message.guild.id}`)
      if (welcome === null)   welcome = 'Not Set'
              let stats = new EmbedBuilder()
      .setDescription(`👋 ${message.guild.name} Booster Stats `)
      .setColor("#f47fff")
            .addFields({
        name:`Boost Channel`,
        value: `${emoji} ${chx}`,
        inline: true,
    },
    {
        name:`Boost Message`,
        value:`${emoji} ${welcome}`,
        inline:true
    },


)
       message.reply({embeds:[stats]})
      }
      else if(args[0] == 'test'){
               let channel = await db.get(`boostchan_${message.guild.id}`)
       let welcome = await db.get(`boostmsg_${message.guild.id}`)
       
      welcome = welcome.replace('{user}', message.member);
      welcome = welcome.replace('{user.name}', message.author.username);
      welcome = welcome.replace('{user.tag}', message.author.tag);
      welcome = welcome.replace('{user.id}', message.author.id);
      welcome = welcome.replace('{boostcount}', message.guild.premiumSubscriptionCount);
      welcome = welcome.replace('{levelcount}', String(message.guild.premiumTier));
      welcome = welcome.replace('{guild.name}', message.member.guild.name);
      welcome = welcome.replace('{guild.id}', message.member.guild.id);
       if(channel && welcome) client.channels.cache.get(channel).send({embeds:[
       {
         description:welcome,
         color:color
       }
       ]})
      }


      
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};