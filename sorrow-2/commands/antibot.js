
const{ EmbedBuilder } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'antibot',
	description: 'kicks every bot added in the server',
	aliases:[],
	usage: ' \```antibot [on/off]\``` ',
  category: "security",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
    const db = client.db;
        let emoji = `• `;
            if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {

    let checkenable = new EmbedBuilder()
    .setDescription(`🟢 Anti Bot Is Enabled `)
    .setThumbnail(`https://cdn.discordapp.com/attachments/991601306747813978/996704762110148688/IconServerSecurity_1.gif`)
    .setColor(color)
    let checkdisabled = new EmbedBuilder()
    .setDescription(`🔴  Anti Bot Is Disabled `)
    .setThumbnail(`https://cdn.discordapp.com/attachments/991601306747813978/996704762110148688/IconServerSecurity_1.gif`)
    .setColor(color)
            let onlyown = new EmbedBuilder()
        .setDescription(`${xmark} Only server owner can use this command`)
        .setColor(error)

        const authorized = [
            message.guild.ownerId,
            owner
        ];
     //if(message.author.id !== message.guild.ownerId) return message.channel.send({embeds:[onlyown]});
   if (!authorized.includes(message.author.id)) return message.reply({embeds:[onlyown]}).catch(() => {/*Ignore error*/})

     let aenabled = new EmbedBuilder().setDescription(`${checked} Anti Bot is now enabled`).setColor(color) 
               let missperms = new EmbedBuilder()
        .setDescription(`${xmark}  You're missing \`MANAGE_GUILD\``)
        .setColor(error)
               
        let nukeable = new EmbedBuilder()
        .setDescription(`${checked} Anti Bot enabled`)
        .setColor(color)
 if (args[0] == 'on') {
if (!authorized.includes(message.author.id)) return message.reply({embeds:[onlyown]});
      if (await await db.has(`anti-bot_${message.guild.id}`) === false) {

        await await db.set(`anti-bot_${message.guild.id}`, true)
        message.reply({ embeds:[nukeable]}).catch(() => {/*Ignore error*/})

      } else return message.reply({ embeds:[aenabled]}).catch(() => {/*Ignore error*/})
    } else if (args[0] == 'off') {
         let disabled = new EmbedBuilder()
         .setDescription(`${checked} Anti Bot is now disabled`)
         .setColor(color)
          let alreadydisabled = new EmbedBuilder()
         .setDescription(`${xmark} Anti Bot is disabled`)
         .setColor(error)
      if (await await db.has(`anti-bot_${message.guild.id}`) === true) {

        await await db.delete(`anti-bot_${message.guild.id}`);
        message.reply({ embeds:[disabled]}).catch(() => {/*Ignore error*/})

      } else return message.reply({ embeds:[alreadydisabled]}).catch(() => {/*Ignore error*/})
    } if(!args[0]){
       let antibot = await db.get(`anti-bot_${message.guild.id}`)
       if(antibot !== true) {return message.reply({embeds:[checkdisabled]}).catch(() => {/*Ignore error*/}) } 
      else if(antibot === true) {return message.reply({embeds:[checkenable]}).catch(() => {/*Ignore error*/}) }
      
    }else if(args[0] == 'info'){
            let embed11 = new EmbedBuilder()
        .setDescription(`\🤖 Anti Bot \n • antibot [on/off] info :\`kicks every new bot if it's enabled \``)
 
        .setColor(color)
        message.reply({embeds:[embed11]}).catch(() => {/*Ignore error*/})
      
    }
	}

            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
};