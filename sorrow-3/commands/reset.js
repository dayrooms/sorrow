
const{ EmbedBuilder } = require('discord.js');
const { default_prefix ,color,error,owner,xmark,checked } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'resetprivacy',
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
                  let mentionedMember = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) 
                  if(! mentionedMember) {
                    let usermention = new EmbedBuilder()
                    .setDescription(`${xmark}  Mention a user/ID`)
                    .setColor(error)
                    return message.reply({
                        embeds: [usermention]
                    });
                }
          
                  let database = await db.get(`blacklisted`)
                  if(database) {
                      let data = database.find(x => x.user ===  mentionedMember.user.id)
                    let unabletofind = new EmbedBuilder()
                    .setDescription(`${xmark}  Could not find that user in the database`)
                    .setColor(error)
                      if(!data) return message.reply({embeds:[unabletofind]})
                    
                      let value = database.indexOf(data)
                      delete database[value]
                    
                      var filter = database.filter(x => {
                        return x != null && x != ''
                      })
                    
                      await db.set(`blacklisted`, filter)
                    let deleted = new EmbedBuilder()
                    .setDescription(`${checked} Removed ${ mentionedMember} From command blacklist `)
                    .setColor(color)
                    
                      return message.reply({
                        embeds: [deleted]
                    });
                    
                  } else {          
                      let notrust = new EmbedBuilder()
                      .setDescription(`${xmark}  That user is not blacklisted`)
                      .setColor(error)
                  message.reply({embeds:[notrust]})
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
