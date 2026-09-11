
const{ EmbedBuilder } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'afk',
	description: 'returns afk message when someone pings you',
	aliases:[],
	usage: ' \```YAML\n\n afk {status}\``` ',
  category: "utility",
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

    
        const content = args.join(" ") ? args.join(' ') : "AFK"
        await await db.set(`afktime-${message.author.id}+${message.guild.id}`,Date.now())
        await await db.set(`afk-${message.author.id}+${message.guild.id}`, content)
        const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({name:`${message.author.username} went AFK`,iconURL:`${message.author.displayAvatarURL({dynamic:true,size:4096})}`})
        .setDescription(` \n **Status**  \n ↳  ${content}`)

        message.reply({embeds:[embed]}).catch(() => {/*Ignore error*/})
              talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
    

	},
};