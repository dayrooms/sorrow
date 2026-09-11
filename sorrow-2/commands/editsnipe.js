
const{ EmbedBuilder } = require('discord.js');
const { default_prefix ,color,error,owner ,xmark} = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'editsnipe',
	description: 'returns latest edited message in the channel ',
	aliases:['es'],
	usage: '\```YAML\n\n editsnipe \```',
  category: "utility",
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
      const msg = await db.get(`editsniped${message.channel.id}`)
              let ok = new EmbedBuilder()
        .setDescription(`${xmark} there are no recently edited messages`)
        .setColor(error)
      if (msg === null) return message.reply({embeds:[ok]})
      let embed = new EmbedBuilder()
     // .addField(`${msg.author}`,`${msg.content}   `)
      .setAuthor({name:`${msg.author}`,iconURL:`${msg.avatar}`})
      .setDescription(' \```' + msg.content + '\``` ')
    //  .setDescription(` **${message.author.tag}** \n \```${msg.content} \````)
      .setFooter({text:`edited message sniped by ${message.author.tag}`})
      .setTimestamp()
       .setColor(message.member.displayHexColor || color)
       if (msg.image) embed.setImage(`${msg.image}`)
        //.setFooter({text: message.author.tag ,iconURL: client.user.displayAvatarURL()})
        await message.channel.send({embeds:[embed]});
      setTimeout(async () => {
        await db.delete(`editsniped${message.channel.id}`)
      },15000)
      

        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(async () => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};