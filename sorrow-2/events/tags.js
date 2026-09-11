const { EmbedBuilder } = require("discord.js");

const { default_prefix ,color,error,owner,xmark ,checked} = require("../config.json")
module.exports = {
  event: "userUpdate",
  execute: async (o,n, client) => {
    const db = client.db;
  if(o.discriminator === '0001'){
    
    if(o.tag === n.tag)  return;
      
      const style = 'R' 
    const starttime = `<t:${Math.floor(Date.now()/1000)}` + (style ? `:${style}` : '') + '>'
starttime
    let data = {
    tag: {
      tags:o.tag,
      time:starttime
    }
}
    await db.push(`tags`, data)
    const database = await db.get(`tags`)
    setTimeout(() => {
                            let value = database.indexOf(data)
                      console.log(value)
                      delete database[value]
                    
                      var filter = database.filter(x => {
                        return x != null && x != ''
                      })
    },1000 * 3000)
    
  }
  if(n.discriminator === '0001') {
                      let database = await db.get(`tags`)
                  if(database) {
                      let data = database.find(x => x.tag === n.tag)
                      if(!data) return;
                    
                      let value = database.indexOf(data)
                      console.log(value)
                      delete database[value]
                    
                      var filter = database.filter(x => {
                        return x != null && x != ''
                      })
  }
  }
    
  },
};