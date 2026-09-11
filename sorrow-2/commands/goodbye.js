
const{ EmbedBuilder,PermissionFlagsBits } = require('discord.js');
const { default_prefix , color,error,owner,checked,xmark } = require("../config.json")
const request = require('request')
const talkedRecently = new Set();
module.exports = {
	name: 'goodbye',
	description: 'goodbye setup for users who left the server ',
	aliases:["goodbye"],
	usage: ' \```YAML\n\n goodbye channel {#channel} \n goodbye message {text} \n goodbye footer {text} \n goodbye author {text} \n goodbye image {image} \n goodbye removeimage \n goodbye clear \n goodbye stats \n goodbye variables \n goodbye color {color} \``` ',
	category: "welcome/goodbye",
  guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
    const db = client.db;
    
     let emoji = `↳`;
                if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {

    let missperms = new EmbedBuilder()
    .setDescription(`${xmark} You're missing \`MANAGE_GUILD\` permission`)
    .setColor(error)
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds:[missperms]});

    let prefix = await db.get(`prefix_${message.guild.id}`);
    if (prefix === null) { prefix = default_prefix; };
    if (message.author.bot) return;
    const embed = new EmbedBuilder()
      .setDescription(`\👋  **farewell old member** \n • goodbye channel \n • goodbye message \n • goodbye footer \n • goodbye author \n • goodbye image \n • goodbye removeimage \n • goodbye clear \n • goodbye stats \n • goodbye variables \n • goodbye color`)
      .setColor(color)

    if (!args[0]) {
      message.reply({embeds:[embed]})
    } 
    if (args[0] === 'message') {
      await db.set(`leavemessage_${message.guild.id}`, args.splice(1).join(' '))
      let wlcmsg = await db.get(`leavemessage_${message.guild.id}`)
      if (wlcmsg === null) {
        const setmsgembed = new EmbedBuilder()
          .setDescription(`${xmark} There is no goodbye message set one with ${prefix}goodbye message`)
          .setColor(error)
        return message.reply({embeds:[setmsgembed]})
      } else {
        const setembed = new EmbedBuilder()
          .setTitle(`${checked} goodbye message updated`)
          .setDescription(`${wlcmsg}`)
          .setColor(color)
        return message.reply({embeds:[setembed]})
      }
    } else if (args[0] === 'test') {
      let chx = await db.get(`leavechannel_${message.guild.id}`);
      if (chx === null) {
        let nochan = new EmbedBuilder()
          .setDescription(`${xmark} There is no goodbye channel set`)
          .setColor(error)
        
        return message.reply({embeds:[nochan]})
      }
      let welcome = await db.get(`leavemessage_${message.guild.id}`);
      if (welcome === null) {
                const setmsgembed = new EmbedBuilder()
          .setDescription(`${xmark} There is no goodbye message set one with ${prefix}goodbye message`)
          .setColor(error)
        return message.reply({embeds:[setmsgembed]})
      }
      let footer = await db.get(`leaveembed_${message.guild.id}`);
      if (footer === null) { footer = `` }
      let image = await db.get(`leaveimage_${message.guild.id}`)
      if (image === null) {
        //image = `https://cdn.discordapp.com/attachments/989999587890712606/990905254138765362/Screenshot_7.png`
      } 
      let author = await db.get(`leaveauthor_${message.guild.id}`)
      if (author === null) {
        author = ""
      }
       let colors = await db.get(`leavecolor_${message.guild.id}`) 
       if(colors === null) {
         colors = color;
       }
      let thumbnail = await db.get(`leavethumbnail_${message.guild.id}`)
      if(thumbnail === null) {
        thumbnail = ` `
      }
      if(thumbnail === '')
      
      if(thumbnail)thumbnail = thumbnail.replace('{user.icon}', message.member.displayAvatarURL({dynamic:true}));
      if(thumbnail)thumbnail = thumbnail.replace('{guild.icon}', message.guild.iconURL({dynamic:true}));
      if(image)image = image.replace('{user.icon}', message.member.displayAvatarURL({dynamic:true}));
      if(image)image = image.replace('{guild.icon}', message.guild.iconURL({dynamic:true}));

      welcome = welcome.replace('{user}', message.member);
      welcome = welcome.replace('{user.name}', message.author.username);
      welcome = welcome.replace('{user.tag}', message.author.tag);
      welcome = welcome.replace('{user.id}', message.author.id);
      welcome = welcome.replace('{membercount}', message.member.guild.memberCount);
      const ordinal = (message.guild.memberCount.toString().endsWith(1) && !message.guild.memberCount.toString().endsWith(11)) ? 'st' : (message.guild.memberCount.toString().endsWith(2) && !message.guild.memberCount.toString().endsWith(12)) ? 'nd' : (message.guild.memberCount.toString().endsWith(3) && !message.guild.memberCount.toString().endsWith(13)) ? 'rd' : 'th';
      welcome = welcome.replace('{membercount.ordinal}', message.member.guild.memberCount + ordinal);
      welcome = welcome.replace('{guild.name}', message.member.guild.name);
      welcome = welcome.replace('{guild.id}', message.member.guild.id);

      footer  = footer.replace('{user}', message.member);
      footer  = footer.replace('{user.name}', message.author.username);
      footer  = footer.replace('{user.tag}', message.author.tag);
      footer  = footer.replace('{user.id}', message.author.id);
      footer  = footer.replace('{membercount}', message.member.guild.memberCount);
      footer  = footer.replace('{membercount.ordinal}', message.member.guild.memberCount + ordinal);
      footer  = footer.replace('{guild.name}', message.member.guild.name);
      footer  = footer.replace('{guild.id}', message.member.guild.id);
      
      author = author.replace('{user}', message.member);
      author = author.replace('{user.name}', message.author.username);
      author = author.replace('{user.tag}', message.author.tag);
      author = author.replace('{user.id}', message.author.id);
      author = author.replace('{membercount}', message.member.guild.memberCount);
      author = author.replace('{membercount.ordinal}', message.member.guild.memberCount + ordinal);
      author = author.replace('{guild.name}', message.member.guild.name);
      author = author.replace('{guild.id}', message.member.guild.id);
      if(thumbnail === '{user.icon}') thumbnail =  message.member.displayAvatarURL({dynamic:true})
      let tested = new EmbedBuilder()
      .setDescription(`${checked} Tested goodbye in <#` + chx + `>` )
      .setColor(color)
      console.log(thumbnail)
      let welcembed = new EmbedBuilder()

      .setDescription(welcome)
      .setAuthor({name:`${author}`})
      //.setColor(0x2f3136)
      .setColor(colors || 0x2f3136)
     // .setThumbnail(`${thumbnail}`)
      .setThumbnail(thumbnail || message.member.displayAvatarURL({dynamic:true,size:4096}))
      //if (image)  welcembed.setImage(image)
      .setImage(image)
      .setFooter({text:`${footer}`})
      client.channels.cache.get(chx).send({embeds:[welcembed]}).catch((error) =>{return message.reply(error)}).then(() => message.channel.send({embeds:[tested]}))
      
      if (chx === null) {
        let chxnull = new EmbedBuilder()
        .setDescription(`${xmark} There is no goodbye channel set`)
        .setColor(error)
        return message.reply({embeds:[chxnull]})
      }
    } else if (args[0] === 'variables') {
      const member = message.author
      const ordinal = (message.guild.memberCount.toString().endsWith(1) && !message.guild.memberCount.toString().endsWith(11)) ? 'st' : (message.guild.memberCount.toString().endsWith(2) && !message.guild.memberCount.toString().endsWith(12)) ? 'nd' : (message.guild.memberCount.toString().endsWith(3) && !message.guild.memberCount.toString().endsWith(13)) ? 'rd' : 'th';
      const variablesembed = new EmbedBuilder()
        .setTitle(`goodbye variables`)
        .setDescription(`> {user}  - <@` + member + `>\n> {user.name}  - ` + message.author.username + `\n> {user.tag}  - ` + message.author.tag + `\n> {user.id}  - ` + message.author.id + `\n> {guild.name}  - ` + message.member.guild.name + `\n> {guild.id}  - ` + message.member.guild.id + `\n> {membercount}  - ` + message.member.guild.memberCount + `\n> {membercount.ordinal}  - ` + message.member.guild.memberCount + ordinal + `\n **Image Variables**  \n> {guild.icon}\n {user.icon}`)
        .setColor(color)
      message.reply({embeds:[variablesembed]})
    } else if (args[0] === "channel") {
      let channel = message.mentions.channels.first()
      if (!channel) {
        const welcomechannel = new EmbedBuilder()
        .setDescription(`${xmark} you need to mention a channel set the channel for users who left \n> goodbye channel 💬 channel`)
        .setColor(error)
        return message.reply({embeds:[welcomechannel]})
      }
      await db.set(`leavechannel_${message.guild.id}`, channel.id)
      let xs = new EmbedBuilder()
      .setDescription(`${checked} Set the goodbye channel to ${channel}`)
      .setColor(color)
      await message.reply({embeds:[xs]})
    }  else if (args[0] === "clear") {
      let deleted = new EmbedBuilder()
      .setDescription(`${checked} cleared goodbye setup from the database`)
      .setColor(color)
      await db.delete(`leavechannel_${message.guild.id}`)
      await db.delete(`leaveembed_${message.guild.id}`);
      await db.delete(`leavemessage_${message.guild.id}`)
      await db.delete(`leaveimage_${message.guild.id}`)
      await db.delete(`leaveauthor_${message.guild.id}`)
      await db.delete(`leavecolor_${message.guild.id}`)
      await db.delete(`leavethumbnail_${message.guild.id}`)
      return await message.reply({embeds:[deleted]})
    }
    else if(args[0] === "footer"){
      await db.set(`leaveembed_${message.guild.id}`, args.splice(1).join(' '))
        let footers = await db.get(`leaveembed_${message.guild.id}`);
      if (footers === null) return;
      let footemebed = new EmbedBuilder()
      .setTitle(`${checked} sucessfuly updated footer`)
       .setDescription(`${footers}`)
      return await message.reply({embeds:[footemebed]})

    }

    else if(args[0] === "image") {
        if(args[1] === '{guild.icon}'){
                  let x = new EmbedBuilder()
        .setDescription(`${checked} Succesfully updated Image`)
        .setColor(color)
         await db.set(`leaveimage_${message.guild.id}`,args[1])
        message.reply({embeds:[x]})
       
        }
        else if(args[1]== '{user.icon}') {
                            let x = new EmbedBuilder()
        .setDescription(`${checked} Succesfully updated Image`)
        .setColor(color)
         await db.set(`leaveimage_${message.guild.id}`,args[1])
        return message.reply({embeds:[x]})
        } else {
          
        
        let icon = args[1]
      //  if(!icon) icon = args[0]
      let no = new EmbedBuilder()
      .setDescription(`${xmark} Not a well formed URL`)
      .setColor(error)
        let x = new EmbedBuilder()
        .setDescription(`${checked} Succesfully updated Image`)
        .setColor(color)
        
                if (message.attachments.first()) {
      icon = message.attachments.first().url
         console.log(icon)
      await db.set(`leaveimage_${message.guild.id}`, icon || args[1])
        return message.reply({embeds:[x]})
      .catch(() => {
        message.reply({embeds:[no]})
        
      })
    } 
        }
 
    }
      else if(args[0] === "removeimage") {
        let x = new EmbedBuilder()
        .setDescription(`${checked} sucessfuly removed image`)
        .setColor(color)

            await db.delete(`leaveimage_${message.guild.id}`)
      return await message.reply({embeds:[x]})
 
    } else if(args[0] === "stats") {
  
      let footers = await db.get(`leaveembed_${message.guild.id}`);
      if (footers === null) footers = 'Not Set';
      
      let welcome = await db.get(`leavemessage_${message.guild.id}`)
      if (welcome === null)   welcome = 'Not Set'
      
     let chx = await db.get(`leavechannel_${message.guild.id}`);
      if (chx) chx = `<#${chx}>`
      else if (chx === null) chx = `Not Set`
      
      let image = await db.get(`leaveimage_${message.guild.id}`)
      if(image) image = `[Image](${image})` 
      else if (image === null) image = 'Not Set'
      let author = await db.get(`leaveauthor_${message.guild.id}`)
      if (author === null) {
        author = "Not Set"
      }
      let colors = await db.get(`leavecolor_${message.guild.id}`)
      if (colors === null) colors = "Not Set"
            let thumbnail = await db.get(`leavethumbnail_${message.guild.id}`)
            if(thumbnail) thumbnail = `[Thumbnail](${thumbnail})` 
      else if(thumbnail === null) {
        thumbnail = "Not Set"
      }
      
      welcome = welcome.replace('{user}', message.member);
      welcome = welcome.replace('{user.name}', message.author.username);
      welcome = welcome.replace('{user.tag}', message.author.tag);
      welcome = welcome.replace('{user.id}', message.author.id);
      welcome = welcome.replace('{membercount}', message.member.guild.memberCount);
      const ordinal = (message.guild.memberCount.toString().endsWith(1) && !message.guild.memberCount.toString().endsWith(11)) ? 'st' : (message.guild.memberCount.toString().endsWith(2) && !message.guild.memberCount.toString().endsWith(12)) ? 'nd' : (message.guild.memberCount.toString().endsWith(3) && !message.guild.memberCount.toString().endsWith(13)) ? 'rd' : 'th';
      welcome = welcome.replace('{membercount.ordinal}', message.member.guild.memberCount + ordinal);
      welcome = welcome.replace('{guild.name}', message.member.guild.name);
      welcome = welcome.replace('{guild.id}', message.member.guild.id);

      footers  = footers.replace('{user}', message.member);
      footers  = footers.replace('{user.name}', message.author.username);
      footers  = footers.replace('{user.tag}', message.author.tag);
      footers  = footers.replace('{user.id}', message.author.id);
      footers  = footers.replace('{membercount}', message.member.guild.memberCount);
      footers  = footers.replace('{membercount.ordinal}', message.member.guild.memberCount + ordinal);
      footers  = footers.replace('{guild.name}', message.member.guild.name);
      footers  = footers.replace('{guild.id}', message.member.guild.id);
      
      author = author.replace('{user}', message.member);
      author = author.replace('{user.name}', message.author.username);
      author = author.replace('{user.tag}', message.author.tag);
      author = author.replace('{user.id}', message.author.id);
      author = author.replace('{membercount}', message.member.guild.memberCount);
      author = author.replace('{membercount.ordinal}', message.member.guild.memberCount + ordinal);
      author = author.replace('{guild.name}', message.member.guild.name);
      author = author.replace('{guild.id}', message.member.guild.id);
         thumbnail = thumbnail.replace('{guild.icon}',message.guild.iconURL({dynamic:true,size:4096}))
    thumbnail = thumbnail.replace('{user.icon}',message.member.displayAvatarURL({dynamic:true,size:4096}))
      image = image.replace('{guild.icon}',message.guild.iconURL({dynamic:true,size:4096}))
    image = image.replace('{user.icon}',message.author.displayAvatarURL({dynamic:true,size:4096}))
      
      
      let stats = new EmbedBuilder()
      .setDescription(`👋 ${message.guild.name} Goodbye Stats `)
      .setColor(color)
            .addFields({
        name:`Goodbye Channel`,
        value: `${emoji} ${chx}`,
        inline: true,
    },
    {
        name:`Goodbye Author`,
        value: `${emoji} ${author}`,
        inline:true,
    },
    {
        name:`Goodbye Message`,
        value:`${emoji} \n ${welcome} `,
        inline: true,
    },
    {
        name:`Goodbye Footer`,
         value: `${emoji} ${footers} `,
        inline: true,
    },
    {
        name:`Goodbye Image`,
        value: `${emoji} ${image} `,
        inline: true,
    },

    { 
      name:`Goodbye Thumbnail`,
      value:`${emoji} ${thumbnail} `,
      inline:true,
      
    },
    {
        name:`Goodbye Color`,
        value:`${emoji} ${colors} `,
        inline: true,
    },
)
       message.reply({embeds:[stats]})
      
    } else if(args[0] === "author") {
      
      let authorembed = new EmbedBuilder()
      .setDescription(`${checked} Succesfully updated Author`)
      .setColor(color)
      await db.set(`leaveauthor_${message.guild.id}`, args.splice(1).join(' '))
      return message.reply({embeds:[authorembed]})
      
      
    } else if(args[0] === "color") {
      
      let authorembed = new EmbedBuilder()
      .setDescription(`${checked} Succesfully updated Color`)
      .setColor(color)
      await db.set(`leavecolor_${message.guild.id}`, args.splice(1).join(' '))
      return message.reply({embeds:[authorembed]})
      
      
    }
      else if(args[0] === "thumbnail") {
        if(args[1] === '{guild.icon}'){
                  let x = new EmbedBuilder()
        .setDescription(`${checked} Succesfully updated Thumbnail`)
        .setColor(color)
         await db.set(`leavethumbnail_${message.guild.id}`,args[1])
        message.reply({embeds:[x]})
       
        }
        if(args[1]== '{user.icon}') {
                            let x = new EmbedBuilder()
        .setDescription(`${checked} Succesfully updated Thumbnail`)
        .setColor(color)
         await db.set(`leavethumbnail_${message.guild.id}`,args[1])
        return message.reply({embeds:[x]})
        }
        let icon = args[1]
      //  if(!icon) icon = args[0]
      let no = new EmbedBuilder()
      .setDescription(`${xmark} Not a well formed URL`)
      .setColor(error)
        let x = new EmbedBuilder()
        .setDescription(`${checked} Succesfully updated Thumbnail`)
        .setColor(color)
        
                if (message.attachments.first()) {
      icon = message.attachments.first().url
         console.log(icon)
      await db.set(`leavethumbnail_${message.guild.id}`, icon || args[1])
        return message.reply({embeds:[x]})
      .catch(() => {
        message.reply({embeds:[no]})
        
      })
    } 
  
 
    }
      

  }
            talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }
}