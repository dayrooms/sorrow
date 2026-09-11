const { EmbedBuilder } = require("discord.js");

const { default_prefix ,color,error,owner,xmark } = require("../config.json")
module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    const db = client.db;
    
      if (message.author.bot) return;
     if (message.partial) return
          let blacklisted = await db.get(`blacklisted`)
        if(blacklisted && blacklisted.find(find => find.user == message.author.id)) {
        return;
        }
    let ds = await db.get(`activity_${message.guild.id}_${message.author.id}`) || 0

      await db.set(`activity_${message.guild.id}_${message.author.id}`,ds + 1)
    

    
    
  },
};