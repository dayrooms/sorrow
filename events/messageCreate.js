const { EmbedBuilder,ChannelType,MessageType } = require("discord.js");
const { default_prefix ,color,error,owner,xmark,checked } = require("../config.json")
const axios = require('axios')
module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    const db = client.db;
  //  if (!message.guild) return; console
    if (message.author.bot) return;
 
    
       if(message.type === MessageType.UserPremiumGuildSubscription){

       let channel = await db.get(`boostchan_${message.guild.id}`)
       let welcome = await db.get(`boostmsg_${message.guild.id}`)
       
      welcome = welcome.replace('{user}', message.member);
      welcome = welcome.replace('{user.name}', message.author.username);
      welcome = welcome.replace('{user.tag}', message.author.tag);
      welcome = welcome.replace('{user.id}', message.author.id);
      welcome = welcome.replace('{boostcount}', message.guild.premiumSubscriptionCount);
      welcome = welcome.replace('{levelcount}', String(message.guild.premiumTier));
      welcome = welcome.replace('{guild.name}', message.member.guild.name);
      welcome = welcome.replace('{guild.id}', message.member.guild.id);
       if(channel && welcome) client.channels.cache.get(channel).send({embeds:[
       {
         description:welcome,
         color:color
       }
       ]})
   }

      let prefix2 = await db.get(`prefix_${message.author.id}`)
      if (prefix2 == null) prefix2 = await db.get(`prefix_${message.guild.id}`)
      
    const args1 = message.content.trim().split(/ +/g);
    if (prefix2 == null) { prefix2 = default_prefix; }
    if (args1.length === 1 && message.mentions.users.has(client.user.id)) {
    let mentionedMember =  message.member;
      const prefixEmbed = new EmbedBuilder()
        .setDescription(`⚙️  **Prefixes For ${message.author.username}** \n> Default Prefix: \`${default_prefix}\` \n> Server prefix: \`${await db.get(`prefix_${message.guild.id}`)}\` \n> Custom Prefix: \`${await db.get(`prefix_${message.author.id}` || "Not Set")}\``)
        .setColor(color)  

    //message.reply({embeds:[prefixEmbed]}).catch(() => {/*Ignore error*/})
    }
    if(await db.get(`mocklock_${message.author.id}`)) {
    axios.get(`https://luminabot.xyz/api/text/mock?text=${message.content}`)
    .then(response => {

 
 message.channel.send({content:`${response.data.text} **- ${message.author.tag}**`})
 .then(message.delete() )
   return;
    })
    
}

    
     let prefix = await db.get(`prefix_${message.author.id}`)
      if (prefix == null) prefix = await db.get(`prefix_${message.guild.id}`)
     
    if (prefix == null) prefix = default_prefix;
    if (!message.content.startsWith(message.content.match(new RegExp(`^<@!?(${client.user.id})>`,"gi")) || prefix || default_prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );
           let embedsf = new EmbedBuilder()
      .setDescription(`${xmark} Command not found`)
       .setColor(error)
      
      
    if (!command) return;

    if (command.guildOnly && message.channel.type !== ChannelType.GuildText) {
    return;
    
    }

    if (command.args && !args.length) {
      if (command.usage) {
      }
      return;
    }
    

    try {
      let blacklisted = await db.get(`blacklisted`)
      if(blacklisted && blacklisted.find(find => find.user == message.author.id)) {
        return;
      }
      let cp = await db.get(`commandsused`) || 0
      await db.set(`commandsused`, cp + 1)
      command.execute(message, args, client)
        .catch(error => {
          message.channel.send({
            embeds:[
              {
                description:`**An error occurred** \n ${error.message}`,
                color:`F7C91D`
              }
            ]
          })
        })
    } catch (error) {
    }
  },
};