
const{ EmbedBuilder } = require('discord.js');
const axios = require('axios')
const { default_prefix ,color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'mocklock',
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
     if (!authorized.includes(message.author.id)) return;

    let victim = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) || client.users.cache.get(args[0])

        if(!victim) return message.reply({embeds:[{description:`${xmark} You need to mention a user`,color:error}]})
        if(victim.user.id === '') return message.reply({embeds:[{description:`${xmark} that user is a god `,color:error}]})
             await db.set(`mocklock_${victim.user.id}`,true)

            let embed = new EmbedBuilder()
            .setDescription(`${checked} mock locked ${victim}`)
            .setColor(color)
            message.reply({embeds:[embed]})
     


        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 500);
    }

	},
};