
const{ EmbedBuilder } = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'ping',
	description: 'returns bots websocket ping',
	aliases:[],
	usage: '\```ping \```',
  category: "information",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
    console.log("PING" + message.author.username)
  let pingemoji = `📶`

        if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {
          if(client.ws.ping < 100) { let pingemoji = `📶`} 
      else  pingemoji = `📵 `

          let embeds = new EmbedBuilder()
        .setDescription(`> ws : \`${Math.round(client.ws.ping)}\` `)
        .setColor(color)
        message.reply({embeds:[embeds]})
        .then(msg => msg.edit({
          embeds:[
            new EmbedBuilder()
        .setDescription(`> 📶 ws \`${Math.round(client.ws.ping)}\` , rest : \`${msg.createdTimestamp - message.createdTimestamp}\``)
        .setColor(color)
          ]
        }))

       //          const msg = await message.reply({content:"Ping?"});
      //  msg.edit({content:`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`})
      

        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};
