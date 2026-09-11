
const{ EmbedBuilder } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'snipe',
	description: 'returns latest deleted message',
	aliases:['s'],
	usage: ' \```YAML\n\n snipe \``` ',
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
      
     // const msg = await db.get(`sniped${message.channel.id}`)
      const msg = await db.get(`snipeindex_${message.channel.id}`)
           
            let ok = new EmbedBuilder()
        .setDescription(`${xmark} ${message.member} there are no recently deleted messages`)
        .setColor(error)
        
      if (msg === null) return message.reply({embeds:[ok]})
      msg.reverse()
      if(args[0] > msg.length) return message.reply({embeds:[{description:`${xmark} ${message.member} that index doesn't exist longest is ${msg.length} `,color:error}]})
      let embed = new EmbedBuilder()

      .setAuthor({name:`${msg[args[0]  - 1|| 0].message.author}`,iconURL:`${msg[args[0]  - 1||0].message.avatar}`})
      .setDescription('' + msg[args[0]  - 1||0].message.content + '')
      .setFooter({text:`(${args[0]|| '1'}/${msg.length})`})
      .setTimestamp()
       .setColor(message.member.displayHexColor || color)
       if (msg[args[0] ||0].message.image) embed.setImage(`${msg[args[0]||0].message.image}`)
        //.setFooter({text: message.author.tag ,iconURL: client.user.displayAvatarURL()})
        await message.channel.send({embeds:[embed]});
      setTimeout(async () => {
        await db.delete(`snipeindex_${message.channel.id}`)
      },600000)
      
      
      
      
      
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(async () => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};