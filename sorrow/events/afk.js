const { EmbedBuilder } = require("discord.js");
const { default_prefix ,color,error,owner } = require("../config.json")
const ms = require('moment');
const talkedRecently = new Set();
module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    const db = client.db;


  if (message.partial) return
  if (message.author.bot) return;
    let tim = await db.get(`afktime-${message.author.id}+${message.guild.id}`)
  if (await db.has(`afk-${message.author.id}+${message.guild.id}`)) {
          const embed2 = new EmbedBuilder()
        .setColor(color)
        .setDescription(`👋  Welcome back ${message.author.tag} `) // + await db.get(`afk-${message.author.id}+${message.guild.id}`)
        .setFooter({text:`last seen ${ms(tim).fromNow()}`})

          const info = await db.get(`afk-${message.author.id}+${message.guild.id}`)
    await await db.delete(`afk-${message.author.id}+${message.guild.id}`)
    message.reply({ embeds:[embed2]});
  }
    
                if (talkedRecently.has(message.author.id)) {
    } else {

  if (message.mentions.members.first()) {
    if (await db.has(`afk-${message.mentions.members.first().id}+${message.guild.id}`)) {
      let time = await db.get(`afktime-${message.mentions.members.first().id}+${message.guild.id}`)
      const embed = new EmbedBuilder()
        .setColor(error)
        .setDescription(` ❌  ${message.mentions.members.first()} is AFK: \n ↳  ` + await db.get(`afk-${message.mentions.members.first().id}+${message.guild.id}`))
        .setFooter({text:`last seen ${ms(time).fromNow()}`})
      message.reply({embeds:[embed]})
    } else return;
  } else;
    
    }



    
              talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 47000);
    

    
  },
};