const { EmbedBuilder } = require("discord.js");
const { default_prefix ,color,error,owner,xmark } = require("../config.json")
module.exports = {
  event: "messageUpdate",
  execute: async (oldMessage, newMessage, client) => {
    const db = client.db;
    if (!newMessage.guild) return;
    if (newMessage.partial) return;

let antilink =  await db.get(`antilink_${newMessage.guild.id}`);
if(antilink !== true) return
      if(newMessage.author.id === client.user.id) return;
      if(newMessage.author.id === newMessage.guild.ownerId) return;
         let trustedusers = await db.get(`linktrusted_${newMessage.guild.id}`)
          if(trustedusers && trustedusers.find(find => find.user == newMessage.author.id)) {
          return;
          }
let filtered = [
  "http://",
  "https://"
]      

try {
  if(newMessage.content.includes('https://')){
   
  newMessage.delete()
  newMessage.channel.send({embeds:[{description:`${xmark} ${newMessage.author.tag} You are not allowed to send links `,color:error}]})
  }
 if(newMessage.content.includes('http://')) {
  
      newMessage.delete()
  newMessage.channel.send({embeds:[{description:`${xmark} ${newMessage.author.tag} You are not allowed to send links `,color:error}]})
  }
}catch{
  
}
      
    
  },
};
