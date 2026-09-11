const { EmbedBuilder } = require("discord.js");
const {
  default_prefix,
  color,
  error,
  owner,
  checked,
  xmark,
} = require("../config.json");
const talkedRecently = new Set();
module.exports = {
  name: "antinuke",
  description: "antinuke events/configs/info",
  aliases: ["an"],
  usage: "  ```YAML\n\n antinuke [on/off] \n antinuke settings \n antinuke info \n antinuke settings \n antinuke enable {event_nane}``` ",
  category: "security",
  guildOnly: false,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  execute: async (message, args, client) => {
    const db = client.db;
    let emoji = `• `;
    if (talkedRecently.has(message.author.id)) {
      message.react(`⌛`);
    } else {
      let vanity = await db.get(`vanity_${message.guild.id}`);
      let checkenable = new EmbedBuilder()
        .setAuthor({ name: "Security" })
        .setDescription(
          `🟢 Antinuke Is Enabled VanityURL - ${vanity} \n Usage : \n • whitelist <<heist#0001> \n • blacklist <<heist#0001>> \n • antinuke [on/off] \n • antinuke info \n • antinuke settings \n • antinuke enable antiban `
        )
        .setThumbnail(
          `https://cdn.discordapp.com/attachments/991601306747813978/996704762110148688/IconServerSecurity_1.gif`
        )
        .setColor(color);
      let checkdisabled = new EmbedBuilder()
        .setDescription(
          `🔴  Antinuke Is Disabled \n Usage : \n • whitelist <<heist#0001> \n • blacklist <<heist#0001>> \n • antinuke [on/off] \n • antinuke info \n • antinuke settings \n • antinuke enable antiban `
        )
        .setThumbnail(
          `https://cdn.discordapp.com/attachments/991601306747813978/996704762110148688/IconServerSecurity_1.gif`
        )
        .setColor(color);
      let onlyown = new EmbedBuilder()
        .setDescription(`${xmark} Only server owner can use this command`)
        .setColor(error);

      const authorized = [message.guild.ownerId, owner];
      //if(message.author.id !== message.guild.ownerId) return message.channel.send({embeds:[onlyown]});
      if (!authorized.includes(message.author.id))
        return message.reply({ embeds: [onlyown] }).catch(() => {
          /*Ignore error*/
        });

      let aenabled = new EmbedBuilder()
        .setDescription(`${checked} Antinuke is now enabled`)
        .setColor(color);
      let missperms = new EmbedBuilder()
        .setDescription(`${xmark}  You're missing \`MANAGE_GUILD\` permission`)
        .setColor(error);

      let nukeable = new EmbedBuilder()
        .setDescription(`${checked} Antinuke Enabled`)
        .setColor(color);
      if (args[0] == "on") {
        if (!authorized.includes(message.author.id))
          return message.reply({ embeds: [onlyown] });
        if ((await await db.has(`anti-new_${message.guild.id}`)) === false) {
          await await db.set(`anti-new_${message.guild.id}`, true)
                    await db.set(`antiguildupdate_${message.guild.id}`,true)

          await db.set(`antiwebhookdelete_${message.guild.id}`,true)
          await db.set(`antichannelcreate_${message.guild.id}`,true)
          
          await db.set(`antichanneldelete_${message.guild.id}`,true)

          await db.set(`antichannelupdate_${message.guild.id}`,true)

          await db.set(`antiban_${message.guild.id}`,true)

          await db.set(`antikick_${message.guild.id}`,true)

          await db.set(`antibotadd_${message.guild.id}`,true)

          await db.set(`antikick_${message.guild.id}`,true)

          await db.set(`antirolecreate_${message.guild.id}`,true)

          await db.set(`antiroledelete_${message.guild.id}`,true)

          await db.set(`antiroleupdate_${message.guild.id}`,true)

          await db.set(`antirolemember_${message.guild.id}`,true)

          await db.set(`antiwebhookcreate_${message.guild.id}`,true)
  
          await db.set(`antiwebhookdelete_${message.guild.id}`,true)

          await db.set(`antiwebhookupdate_${message.guild.id}`,true)
          message
            .reply({
              embeds: [nukeable],
              content: `**Whitelist all trusted admins**`,
            })
            .catch(() => {
              /*Ignore error*/
            });
        } else
          return message.reply({ embeds: [aenabled] }).catch(() => {
            /*Ignore error*/
          });
      } else if (args[0] == "off") {
        await db.delete(`trustedusers_${message.guild.id}`);
                   await db.delete(`antiguildupdate_${message.guild.id}`)
  
          await db.delete(`antichannelcreate_${message.guild.id}`)
          
          await db.delete(`antichanneldelete_${message.guild.id}`)
     
          await db.delete(`antichannelupdate_${message.guild.id}`)
  
          await db.delete(`antiban_${message.guild.id}`)
      
          await db.delete(`antikick_${message.guild.id}`)
        
          await db.delete(`antibotadd_${message.guild.id}`)
    
          await db.delete(`antikick_${message.guild.id}`) 
      
          await db.delete(`antirolecreate_${message.guild.id}`)
      
          await db.delete(`antiroledelete_${message.guild.id}`)
      
          await db.delete(`antiroleupdate_${message.guild.id}`)
      
          await db.delete(`antirolemember_${message.guild.id}`)
 
          await db.delete(`antiwebhookcreate_${message.guild.id}`)
     
          await db.delete(`antiwebhookdelete_${message.guild.id}`)
    
          await db.delete(`antiwebhookupdate_${message.guild.id}`)
        let disabled = new EmbedBuilder()
          .setDescription(`${checked}  Antinuke is now disabled`)
          .setColor(color);
        let alreadydisabled = new EmbedBuilder()
          .setDescription(`${xmark}  Antinuke is disabled`)
          .setColor(error);
        if ((await await db.has(`anti-new_${message.guild.id}`)) === true) {
          await await db.delete(`anti-new_${message.guild.id}`);
          message.reply({ embeds: [disabled] }).catch(() => {
            /*Ignore error*/
          });
        } else
          return message.reply({ embeds: [alreadydisabled] }).catch(() => {
            /*Ignore error*/
          });
      }
      if (!args[0]) {
        let antinuke = await db.get(`anti-new_${message.guild.id}`);
        if (antinuke !== true) {
          return message.reply({ embeds: [checkdisabled] }).catch(() => {
            /*Ignore error*/
          });
        } else if (antinuke === true) {
          return message.reply({ embeds: [checkenable] }).catch(() => {
            /*Ignore error*/
          });
        }
      } else if (args[0] == "info") {
        let embed11 = new EmbedBuilder()
          .setTitle(
            `🛡️  Sorrow Antinuke To keep your server safe`
          )
          .addFields({
            name: `Anti Features :`,
            value: ` • Vanity Update \n • Channel Create \n • Channel Delete \n • Channel Update \n • Ban Add \n • Bot Add \n • Kick Add \n • Role Create \n • Role Delete \n • Role Update \n • Role Member \n• Webhook Create \n • Webhook Delete \n • Webhook Update`
          })
          .setThumbnail(client.user.displayAvatarURL())
          .setColor(color);

        message.reply({ embeds: [embed11] }).catch(() => {
          /*Ignore error*/
        });
      }else if(args[0] == 'enable'){
               let enbla = await db.get(`anti-new_${message.guild.id}`)

       if(enbla!== true) {return message.reply({embeds:[{description:`${xmark} You need to enable antinuke first.`,color:error}]}) } 
        if(args[1] == 'antiguildupdate'){
          await db.set(`antiguildupdate_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antichannelcreate'){
          await db.set(`antichannelcreate_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antichanneldelete'){
          await db.set(`antichanneldelete_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antichannelupdate'){
          await db.set(`antichannelupdate_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antiban'){
          await db.set(`antiban_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antikick'){
          await db.set(`antikick_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antibotadd'){
          await db.set(`antibotadd_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antikick'){
          await db.set(`antikick_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antirolecreate'){
          await db.set(`antirolecreate_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antiroledelete'){
          await db.set(`antiroledelete_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antiroleupdate'){
          await db.set(`antiroleupdate_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antirolemember'){
          await db.set(`antirolemember_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antiwebhookcreate'){
          await db.set(`antiwebhookcreate_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antiwebhookdelete'){
          await db.set(`antiwebhookdelete_${message.guild.id}`,true)
          message.react(`👎 `)
        }else if(args[1] == 'antiwebhookupdate'){
          await db.set(`antiwebhookupdate_${message.guild.id}`,true)
          message.react(`👎 `)
        }
        
      }else if(args[0] == 'disable'){
                       let enbla = await db.get(`anti-new_${message.guild.id}`)

       if(enbla!== true) {return message.reply({embeds:[{description:`${xmark} You need to enable antinuke first.`,color:error}]}) } 
        if(args[1] == 'antiguildupdate'){
          await db.delete(`antiguildupdate_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antichannelcreate'){
          await db.delete(`antichannelcreate_${message.guild.id}`)
          message.react(`👎 `)
          
        }else if(args[1] == 'antichanneldelete'){
          await db.delete(`antichanneldelete_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antichannelupdate'){
          await db.delete(`antichannelupdate_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antiban'){ //
          await db.delete(`antiban_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antikick'){
          await db.delete(`antikick_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antibotadd'){
          await db.delete(`antibotadd_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antikick'){
          await db.delete(`antikick_${message.guild.id}`) //
          message.react(`👎 `)
        }else if(args[1] == 'antirolecreate'){
          await db.delete(`antirolecreate_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antiroledelete'){
          await db.delete(`antiroledelete_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antiroleupdate'){
          await db.delete(`antiroleupdate_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antirolemember'){
          await db.delete(`antirolemember_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antiwebhookcreate'){
          await db.delete(`antiwebhookcreate_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antiwebhookdelete'){
          await db.delete(`antiwebhookdelete_${message.guild.id}`)
          message.react(`👎 `)
        }else if(args[1] == 'antiwebhookupdate'){
          await db.delete(`antiwebhookupdate_${message.guild.id}`)
          message.react(`👎 `)
        }
        
      }else if(args[0] == 'settings'){
                       let enbla = await db.get(`anti-new_${message.guild.id}`)

       if(enbla!== true) {return message.reply({embeds:[{description:`${xmark} You need to enable antinuke first.`,color:error}]}) } 
                let antibotadd = await db.get(`antibotadd_${message.guild.id}`) //done
        if(antibotadd == true)  antibotadd = `🟢 ` 
        else antibotadd = `🔴  `
        
        
        let antiguild = await db.get(`antiguildupdate_${message.guild.id}`)
        if(antiguild == true)  antiguild = `🟢  ` 
        else antiguild = `🔴  `
        
        let antichannelcreate = await db.get(`antichannelcreate_${message.guild.id}`)//done
        if(antichannelcreate == true)  antichannelcreate = `🟢  ` 
        else antichannelcreate = `🔴  `
        
        let antichanneldelete = await db.get(`antichanneldelete_${message.guild.id}`)//done
        if(antichanneldelete == true)  antichanneldelete = `🟢  ` 
        else antichanneldelete = `🔴  `
        
        let antichannelupdate = await db.get(`antichannelupdate_${message.guild.id}`)//done
        if(antichannelupdate == true)  antichannelupdate = `🟢  ` 
        else antichannelupdate = `🔴  `
                
        let antiban = await db.get(`antiban_${message.guild.id}`) //done
        if(antiban == true)  antiban = `🟢  ` 
        else antiban = `🔴  `
                
        let antikick = await db.get(`antikick_${message.guild.id}`)//done
        if(antikick == true)  antikick = `🟢  ` 
        else antikick = `🔴  `
                
        let antirolecreate = await db.get(`antirolecreate_${message.guild.id}`)//done
        if(antirolecreate == true)  antirolecreate = `🟢  ` 
        else antirolecreate = `🔴  `
                
        let antiroledelete = await db.get(`antiroledelete_${message.guild.id}`)//done
        if(antiroledelete == true)  antiroledelete = `🟢  ` 
        else antiroledelete = `🔴  `
                
        let antiroleupdate = await db.get(`antiroleupdate_${message.guild.id}`)//done
        if(antiroleupdate == true)  antiroleupdate = `🟢  ` 
        else antiroleupdate = `🔴  `
                        
        let antirolemember = await db.get(`antirolemember_${message.guild.id}`)//done
        if(antirolemember == true)  antirolemember = `🟢  ` 
        else antirolemember = `🔴  `
                        
        let antiwebhookcreate = await db.get(`antiwebhookcreate_${message.guild.id}`)//done
        if(antiwebhookcreate == true)  antiwebhookcreate = `🟢  ` 
        else antiwebhookcreate = `🔴  `
                        
        let antiwebhookdelete = await db.get(`antiwebhookdelete_${message.guild.id}`)//done
        if(antiwebhookdelete == true)  antiwebhookdelete = `🟢  ` 
        else antiwebhookdelete = `🔴  `
                        
        let antiwebhookupdate = await db.get(`antiwebhookupdate_${message.guild.id}`)//done
        if(antiwebhookupdate == true)  antiwebhookupdate = `🟢  ` 
        else antiwebhookupdate = `🔴  `
        
        let antilink =  await db.get(`antilink_${message.guild.id}`);
        if(antilink == true)  antilink = `🟢  ` 
        else antilink = `🔴  `
        
        let antialt = await await db.get(`antiraid_${message.guild.id}`);
        if(antialt  == true) antialt  = `🟢  ` 
        else antialt = `🔴 `
        
        let embed = new EmbedBuilder()
        //.setAuthor({name:`     Sorrow Antinuke Settings`,iconURL:`${client.user.displayAvatarURL({dynamic:true})}`})
       //.setTitle(`：             Sorrow Antinuke Setting              ：`)
        .setDescription('\```' + `             Sorrow Antinuke Setting              ` + '\```')
        .addFields(
          {
            name:`Anti Guild Update`,
            value:`↳ Status ${antiguild} \n ↳ Usage : ,antinuke [enable/disable] antiguildupdate`,
            inline:true
          },
          {
            name:`Anti Channel Create`,
            value:`↳ Status ${antichannelcreate} \n ↳ Usage : ,antinuke [enable/disable] antichannelcreate`,
            inline:true
          },
          {
            name:`Anti Channel Delete`,
            value:`↳ Status ${antichanneldelete} \n ↳ Usage : ,antinuke [enable/disable] antichanneldelete`,
            inline:true
          },
          {
            name:`Anti Channel Update`,
            value:`↳ Status ${antichannelupdate} \n ↳ Usage : ,antinuke [enable/disable] antichannelupdate`,
            inline:true
          },
          {
            name:`Anti Ban`,
            value:`↳ Status ${antiban} \n ↳ Usage : ,antinuke [enable/disable] antibann`,
            inline:true
          },
          {
            name:`Anti Bot Add`,
            value:`↳ Status ${antibotadd} \n ↳ Usage : ,antinuke [enable/disable] antibotadd`,
            inline:true
          },
          {
            name:`Anti Kick`,
            value:`↳ Status ${antikick} \n ↳ Usage : ,antinuke [enable/disable] antikick`,
            inline:true
          },
          {
            name:`Anti Role Create`,
            value:`↳ Status ${antirolecreate} \n ↳ Usage : ,antinuke [enable/disable] antirolecreate`,
            inline:true
          },
          {
            name:`Anti Role Delete`,
            value:`↳ Status ${antiroledelete} \n ↳ Usage : ,antinuke [enable/disable] antirolecreate`,
            inline:true
          },
          {
            name:`Anti Role Update`,
            value:`↳ Status ${antiroleupdate} \n ↳ Usage : ,antinuke [enable/disable] antiroleupdate`,
            inline:true
          },
          {
            name:`Anti Role Members`,
            value:`↳ Status ${antirolemember} \n ↳ Usage : ,antinuke [enable/disable] antirolemember`,
            inline:true
          },
          {
            name:`Anti Webhook Create`,
            value:`↳ Status ${antiwebhookcreate} \n ↳ Usage : ,antinuke [enable/disable] antiwebhookcreate`,
            inline:true
          },
          {
            name:`Anti Webhook Delete`,
            value:`↳ Status ${antiwebhookdelete} \n ↳ Usage : ,antinuke [enable/disable] antiwebhookdelete`,
            inline:true
          },
          {
            name:`Anti Webhook Update`,
            value:`↳ Status ${antiwebhookupdate} \n ↳ Usage : ,antinuke [enable/disable] antiwebhookupdate`,
            inline:true
          },
          {
            name:`Anti Alt Account`,
            value:`↳ Status ${antialt} \n ↳ Usage : ,antialt [on/off]`,
            inline:true
          },
          {
            name:`Anti Link`,
            value:`↳ Status ${antilink} \n ↳ Usage : ,antilink [on/off]`,
            inline:true
          }
        )
        .setThumbnail(client.user.displayAvatarURL({dynamic:true,size:4096}))
        .setColor(color)
        message.reply({embeds:[embed]})
      }
      
      
    }

    talkedRecently.add(message.author.id);
    setTimeout(() => {
      // Removes the user from the set after a minute
      talkedRecently.delete(message.author.id);
    }, 3500);
  },
};
