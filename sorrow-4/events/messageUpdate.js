const { EmbedBuilder,AttachmentBuilder } = require("discord.js");
const { default_prefix ,color,error,owner } = require("../config.json")
const ms = require('moment');
const client = require('../index')

module.exports = {
  event: "messageUpdate",
  execute: async (oldMessage,newMessage,client,args) => {
    const db = client.db;
    if(newMessage.author.bot)return;
  if(newMessage.content.includes('https://')) return;
    //if(message.author.id === '') return;
    //console.log(message.attachments.first().proxyURL)
 if (newMessage.attachments.size > 0) {
 let image = newMessage.attachments.first().proxyURL; 
    if (newMessage.author.bot) return;
  if (newMessage.partial) return
        if (message.author) {
      await db.set(`editsniped${newMessage.channel.id}`, {
        content: newMessage.content,
        author: newMessage.author.tag,
        image: newMessage.attachments.first().proxyURL,
        avatar:newMessage.author.displayAvatarURL({dynamic:true})
      })
    }
  let auto = await db.get(`autosniped_${newMessage.guild.id}`);
  if(auto === true) {
   let image = newMessage.attachments.first() ? newMessage.attachments.first().proxyURL : null
    let embed = new EmbedBuilder()
    .setAuthor({name:`${newMessage.author.tag}`,iconURL:`${newMessage.author.displayAvatarURL()}`})
     .setDescription(' \```' + newMessage.content + '\``` ')
    .setTimestamp()
    .setColor(newMessage.member.displayHexColor || color)
    .setFooter({text:`Auto-Edit-Sniped`})
   .setImage(newMessage.attachments.first().proxyURL)
   newMessage.channel.send({embeds:[embed]})
    
}
      let chx = await db.get(`logs_${newMessage.guild.id}`);
     if(chx) {
   let image = newMessage.attachments.first() ? newMessage.attachments.first().proxyURL : null
    let embed = new EmbedBuilder()

     .setDescription(`**Mod Logs** 🔨  \n\n ↳ Message Deleted by ${newMessage.author.tag} ↳ \n `+' \```' + newMessage.content + '\```  \n  \```' + oldMessage.content + '\``` ')

    .setColor(color)
   .setImage(message.attachments.first().proxyURL)
    message.guild.channels.cache.get(chx).send({embeds:[embed]})

}//message
 } else {
     if (newMessage.partial) return
        if (newMessage.author) {
      await db.set(`editsniped${newMessage.channel.id}`, {
        content: newMessage.content,
        author: newMessage.author.tag,
        avatar:newMessage.author.displayAvatarURL({dynamic:true})
      })
    }
  let auto = await db.get(`autosniped_${newMessage.guild.id}`);
  if(auto === true) {
   let image = newMessage.attachments.first() ? newMessage.attachments.first().proxyURL : null
    let embed = new EmbedBuilder()
    .setAuthor({name:`${newMessage.author.tag}`,iconURL:`${newMessage.author.displayAvatarURL()}`})
          .setDescription(' \```' + newMessage.content + '\``` ')
    .setTimestamp()
    .setFooter({text:`Auto-Edit-Sniped`})
    .setColor(newMessage.member.displayHexColor || color)
    newMessage.channel.send({embeds:[embed]})
  }
     let chx = await db.get(`logs_${newMessage.guild.id}`);
     if(chx) {
   let image = newMessage.attachments.first() ? newMessage.attachments.first().proxyURL : null
    let embed = new EmbedBuilder()
     .setDescription(`**Mod Logs** 🔨  \n\n ↳ Message Edited by ${newMessage.author.tag} ↳ \n `+' \```' + newMessage.content + '\``` \n \```' + oldMessage.content + '\``` ')
   

    .setColor(color)
    newMessage.guild.channels.cache.get(chx).send({embeds:[embed]})
  }
   
 }
    
  },
};