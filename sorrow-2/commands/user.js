
const{ EmbedBuilder } = require('discord.js');
const { default_prefix ,color,error,owner,xmark,checked } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'user',
	description: '',
	aliases:[],
	usage: '',
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
    const db = client.db;
  let pingemoji = `📶`

        if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {
              const authorized = [
            owner,
        ];
     //if(message.author.id !== message.guild.ownerId) return message.channel.send({embeds:[onlyown]});
     if (!authorized.includes(message.author.id)) return 
         if(!args[0] == 'unblacklist'){
                             let database = await db.get(`blacklisted`)
                  if(database) {
                      let data = database.find(x => x.user ===  args[1])

                      if(!data) return message.react(`❌ `)
                    
                      let value = database.indexOf(data)
                      delete database[value]
                    
                      var filter = database.filter(x => {
                        return x != null && x != ''
                      })
                    
                    message.react('✅')
                    
                  }
         }else if(args[0] == 'blacklist'){
                         let data = {
    user: args[1]
}
              await db.push(`blacklisted`,data)
         }
      message.react(`✅ `)

        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};