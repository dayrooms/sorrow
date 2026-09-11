const { EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType,MessageType } = require("discord.js");
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
      if (prefix2 === null) prefix2 = await db.get(`prefix_${message.guild.id}`)
      
    const args1 = message.content.trim().split(/ +/g);
    if (prefix2 === null) { prefix2 = default_prefix; }
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
      if (prefix === null) prefix = await db.get(`prefix_${message.guild.id}`)
     
    if (prefix === null) prefix = default_prefix;
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
              let trustedusers = await db.get(`privacy`)
        if(trustedusers && trustedusers.find(find => find.user == message.author.id)) {
          let cp = await db.get(`commandsused`)
          await db.set(`commandsused`,cp + 1)
         // console.log(message.content)
        command.execute(message,args,client)
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
        }
      else {
                  const row = new ActionRowBuilder().addComponents(
             new ButtonBuilder()
              .setCustomId('yes')
              .setEmoji("✅")
              .setStyle(ButtonStyle.Secondary),
            
            new ButtonBuilder()
              .setCustomId('no')
              .setEmoji("❌")
              .setStyle(ButtonStyle.Secondary)
          )
          let msg = message.reply({embeds:[
            new EmbedBuilder().setDescription(`Do you agree to Sorrow's usage terms? \n **Warning** Reacting with ${xmark} will blacklist you from using sorrow`).setColor(color)
          ],
                         components:[row]
                        })
         // const filter = (i) => {
        //    if(i.author.id === message.author.id) return true
        //  }
          
          const collector = message.channel.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            max:1
          })
          
          collector.on("end", async (ButtonInteraction) => {
           
            const id = ButtonInteraction.first().customId;
            if(id === 'yes') {
              
                      let trustedusers = await db.get(`privacy`)
        if(trustedusers && trustedusers.find(find => find.user == message.author.id)) {
          let trust = new EmbedBuilder()
          .setColor(error)
          .setDescription(`${xmark} That user is already whitelisted`)
        return 
        }
let data = {
    user: message.author.id
}
        await db.push(`privacy`, data)
        let added = new EmbedBuilder()
        .setDescription(`
       ${checked}  You accepted Sorrow's usage terms
        `)
        .setColor(color)

        return message.reply({
            embeds: [added]
        });

              
              
              
              
            }
            if(id === 'no') {
              let data = {
    user: message.author.id
}
              await db.push(`blacklisted`,data)
           let embed = new EmbedBuilder()
          .setColor(color)
            return message.channel.send({embeds:[
              new EmbedBuilder().setDescription(`${xmark} now you'll be blacklisted from using commands`).setColor(color)
            ]})
            }
          })
        
      }


     // command.execute(message,args,client)
       console.log(`Comamnd ran by un authorized user ${message.author.tag} command : ${command.name} Time : ${Date.now()} Server : ${message.guild.name}`)
    

     // command.execute(message, args, client);
    } catch (error) {
    }
  },
};