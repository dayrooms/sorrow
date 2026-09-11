const { EmbedBuilder } = require("discord.js");

const { default_prefix ,color,error,owner,xmark ,checked} = require("../config.json")
module.exports = {
  event: "userUpdate",
  execute: async (o,n, client) => {
    const db = client.db;
  
    
    if(o.tag === n.tag)  return;
      
      const style = 'R' 
    const starttime = `<t:${Math.floor(Date.now()/1000)}` + (style ? `:${style}` : '') + '>'
starttime
    let data = {
    name: {
      oldName:o.tag,
      time:starttime
    }
}
    await db.push(`names_${n.id}`, data)
    const database = await db.get(`names_${n.id}`)

  },
};