require("dotenv").config();

const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  AuditLogEvent
} = require("discord.js");

const axios = require("axios");
const request = require("request");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping
  ],
  ws: {
    properties: {
      $browser: "Discord iOS"
    }
  },
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User
  ],
  restTimeOffset: 0,
  allowedMentions: {
    parse: ["roles", "users"],
    repliedUser: false
  }
});

const { QuickDB, SqliteDriver } = require('quick.db');
(async () => {
  const sqlite = new SqliteDriver('./json.sqlite');

  client.db = new QuickDB({ driver: sqlite });
})();

const { default_prefix, color, error } = require("./config.json");

const token = process.env.DISCORD_TOKEN;

client.loadedOn = Date.now()

const headers = { "Authorization": 'Bot ' + token };
client.commands = new Collection();

// Render's free "Web Service" tier requires an HTTP port to be bound,
// even though a Discord bot doesn't need one. This tiny server exists
// purely to satisfy that health check — it does nothing else.
const http = require("http");
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Sorrow is running.");
}).listen(PORT, () => {
  console.log(`Dummy HTTP server listening on port ${PORT} (for host health checks)`);
});
client.aliases = new Collection();

fs.readdir("./commands/", async (err, files) => {
  const commandHandler = require("./handlers/command");
  await commandHandler(err, files, client);
});

fs.readdir("./events/", (err, files) => {
  const eventHandler = require("./handlers/event");
  eventHandler(err, files, client);
});


client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;


  const newMember = member
  const autoroleId = await client.db.get(`autorole_${member.guild.id}`);
  const role = member.guild.roles.cache.find(r => r.id === autoroleId);
  if (role) member.roles.add(role, "Auto-Role");


})

const usersMap = new Map();
const LIMIT = 10;
const DIFF = 1500;

client.on('messageCreate', async (message) => {

  try {
    //   if (message.author.id === member.guild.ownerId) return;
    //if (message.author.id === client.user.id) return;
    let trustedusers = await client.db.get(`trustedusers_${message.guild.id}`)
    if (trustedusers && trustedusers.find(find => find.user == message.author.id)) {
      return;
    }


    let member = message.guild.members.cache.get(message.author.id)
    // if(message.author.bot) return;
    const antiRaid = await client.db.get(`antispam_${message.guild.id}`);
    if (antiRaid !== true) return
    if (message.content.includes("@everyone")) {
      await member.timeout(470000, {
        reason: "Anti Raid"
      });
      await member.roles.cache.map(roled => {
        if (roled.managed) return;
        member.roles.remove(roled)
      })

    }
    if (message.content.includes("@here")) {
      await member.timeout(470000, {
        reason: "Anti Raid"
      });
      await member.roles.cache.map(roled => {
        member.roles.remove(roled)
      })

    }
    if (usersMap.has(message.author.id)) {
      const userData = usersMap.get(message.author.id);
      const { lastMessage, timer } = userData;
      const difference = message.createdTimestamp - lastMessage.createdTimestamp;
      let msgCount = userData.msgCount;


      if (difference > DIFF) {
        clearTimeout(timer);

        userData.msgCount = 1;
        userData.lastMessage = message;
        userData.timer = setTimeout(() => {
          usersMap.delete(message.author.id);
          // console.log('Removed from map.')
        }, 47000);
        usersMap.set(message.author.id, userData)
      }
      else {
        ++msgCount;
        if (parseInt(msgCount) === LIMIT) {

          await member.timeout(470000, {
            reason: "Anti Raid"
          });
          // await member.roles.cache.map(roled => {
          ///  })
          await member.edit({
            roles: '',
          }).catch(() => { })

          message.channel.bulkDelete(LIMIT);

        } else {
          await member.timeout(470000, {
            reason: "Anti Raid"
          });
          await member.roles.cache.map(roled => {
            member.roles.remove(roled).catch(console.log)
          })
          userData.msgCount = msgCount;
          usersMap.set(message.author.id, userData);
        }
      }
    }
    else {
      let fn = setTimeout(() => {

        usersMap.delete(message.author.id);
        //console.log('Removed from map.')
      }, 47000);
      usersMap.set(message.author.id, {
        msgCount: 1,
        lastMessage: message,
        timer: fn
      });
    }
  } catch { }
})
// Anti Alt
const ms = require('moment');
client.on('guildMemberAdd', async (member) => {

  const anti = await client.db.get(`antiraid_${member.guild.id}`);
  if (anti) {
    let minAge = (1210000000)
    let creD = new Date(member.user.createdAt);
    let notS = Date.now() - creD.getTime();

    if (minAge > notS) {

      member.kick('Anti Alt Account')

    }
  } else return;
});
client.on("guildMemberRemove", async (member) => {
  let chx = await client.db.get(`leavechannel_${member.guild.id}`);
  if (chx == null) {
    return;
  }
  let welcome = await client.db.get(`leavemessage_${member.guild.id}`);
  if (welcome == null) {
    return;
  }
  let footer = await client.db.get(`leaveembed_${member.guild.id}`);
  if (footer == null) { footer = `` }
  let image = await client.db.get(`leaveimage_${member.guild.id}`)
  if (image == null) {
    //image = `https://cdn.discordapp.com/attachments/989999587890712606/990905254138765362/Screenshot_7.png`
  }
  let author = await client.db.get(`leaveauthor_${member.guild.id}`)
  if (author == null) {
    author = ""
  }
  let colors = await client.db.get(`leavecolor_${member.guild.id}`)
  if (colors == null) {
    colors = color;
  }
  let thumbnail = await client.db.get(`leavethumbnail_${member.guild.id}`)
  if (thumbnail == null) {
    thumbnail = ` `
  }
  if (thumbnail === '')

    if (thumbnail) thumbnail = thumbnail.replace('{user.icon}', member.user.displayAvatarURL({ dynamic: true }));
  if (thumbnail) thumbnail = thumbnail.replace('{guild.icon}', member.guild.iconURL({ dynamic: true }));
  if (image) image = image.replace('{user.icon}', member.user.displayAvatarURL({ dynamic: true }));
  if (image) image = image.replace('{guild.icon}', member.guild.iconURL({ dynamic: true }));

  welcome = welcome.replace('{user}', member);
  welcome = welcome.replace('{user.name}', member.user.username);
  welcome = welcome.replace('{user.tag}', member.user.tag);
  welcome = welcome.replace('{user.id}', member.user.id);
  welcome = welcome.replace('{membercount}', member.guild.memberCount);
  const ordinal = (member.guild.memberCount.toString().endsWith(1) && !member.guild.memberCount.toString().endsWith(11)) ? 'st' : (member.guild.memberCount.toString().endsWith(2) && !member.guild.memberCount.toString().endsWith(12)) ? 'nd' : (member.guild.memberCount.toString().endsWith(3) && !member.guild.memberCount.toString().endsWith(13)) ? 'rd' : 'th';
  welcome = welcome.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
  welcome = welcome.replace('{guild.name}', member.guild.name);
  welcome = welcome.replace('{guild.id}', member.guild.id);

  footer = footer.replace('{user}', member);
  footer = footer.replace('{user.name}', member.user.username);
  footer = footer.replace('{user.tag}', member.user.tag);
  footer = footer.replace('{user.id}', member.user.id);
  footer = footer.replace('{membercount}', member.guild.memberCount);
  footer = footer.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
  footer = footer.replace('{guild.name}', member.guild.name);
  footer = footer.replace('{guild.id}', member.guild.id);

  author = author.replace('{user}', member);
  author = author.replace('{user.name}', member.user.username);
  author = author.replace('{user.tag}', member.user.tag);
  author = author.replace('{user.id}', member.user.id);
  author = author.replace('{membercount}', member.guild.memberCount);
  author = author.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
  author = author.replace('{guild.name}', member.guild.name);
  author = author.replace('{guild.id}', member.guild.id);
  if (thumbnail === '{user.icon}') thumbnail = member.user.displayAvatarURL({ dynamic: true })
  let welcembed = new EmbedBuilder()

    .setDescription(welcome)
    .setAuthor({ name: `${author}` })
    //.setColor(0x2f3136)
    .setColor(colors || 0x2f3136)
    // .setThumbnail(`${thumbnail}`)
    .setThumbnail(thumbnail || member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
    //if (image)  welcembed.setImage(image)
    .setImage(image)
    .setFooter({ text: `${footer}` })
  client.channels.cache.get(chx).send({ embeds: [welcembed] }).catch((error) => {/* */ })




})
client.on("guildMemberAdd", async (member) => {
  let welcome = await client.db.get(`joindmmessage_${member.guild.id}`);
  if (welcome == null) {
    return;
  }
  let footer = await client.db.get(`joindmwelcembed_${member.guild.id}`);
  if (footer == null) { footer = `` }
  let image = await client.db.get(`joindmimage_${member.guild.id}`)
  if (image == null) {
    //image = `https://cdn.discordapp.com/attachments/989999587890712606/990905254138765362/Screenshot_7.png`
  }
  let author = await client.db.get(`joindmauthor_${member.guild.id}`)
  if (author == null) {
    author = ""
  }
  let colors = await client.db.get(`joindmcolor_${member.guild.id}`)
  if (colors == null) {
    colors = color;
  }
  let thumbnail = await client.db.get(`joindmthumbnail_${member.guild.id}`)
  if (thumbnail == null) {
    thumbnail = ` `
  }
  if (thumbnail === '')

    welcome = welcome.replace('{user}', member);
  welcome = welcome.replace('{user.name}', member.user.username);
  welcome = welcome.replace('{user.tag}', member.user.tag);
  welcome = welcome.replace('{user.id}', member.user.id);
  welcome = welcome.replace('{membercount}', member.guild.memberCount);
  const ordinal = (member.guild.memberCount.toString().endsWith(1) && !member.guild.memberCount.toString().endsWith(11)) ? 'st' : (member.guild.memberCount.toString().endsWith(2) && !member.guild.memberCount.toString().endsWith(12)) ? 'nd' : (member.guild.memberCount.toString().endsWith(3) && !member.guild.memberCount.toString().endsWith(13)) ? 'rd' : 'th';
  welcome = welcome.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
  welcome = welcome.replace('{guild.name}', member.guild.name);
  welcome = welcome.replace('{guild.id}', member.guild.id);

  footer = footer.replace('{user}', member);
  footer = footer.replace('{user.name}', member.username);
  footer = footer.replace('{user.name}', member.username);
  footer = footer.replace('{user.id}', member.id);
  footer = footer.replace('{membercount}', member.guild.memberCount);
  footer = footer.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
  footer = footer.replace('{guild.name}', member.guild.name);
  footer = footer.replace('{guild.id}', member.guild.id);

  author = author.replace('{user}', member.member);
  author = author.replace('{user.name}', member.username);
  author = author.replace('{user.name}', member.username);
  author = author.replace('{user.id}', member.id);
  author = author.replace('{membercount}', member.guild.memberCount);
  author = author.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
  author = author.replace('{guild.name}', member.guild.name);
  author = author.replace('{guild.id}', member.guild.id);
  if (thumbnail) thumbnail = thumbnail.replace('{guild.icon}', member.guild.iconURL({ dynamic: true, size: 4096 }))
  if (thumbnail) thumbnail = thumbnail.replace('{user.icon}', member.user.displayAvatarURL({ dynamic: true, size: 4096 }))
  if (image) image = image.replace('{guild.icon}', member.guild.iconURL({ dynamic: true, size: 4096 }))
  if (image) image = image.replace('{user.icon}', member.user.displayAvatarURL({ dynamic: true, size: 4096 }))

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('primary')
        .setLabel('Message sent from Server: ' + member.guild.name)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    )
  let welcembed = new EmbedBuilder()
    .setAuthor({ name: `${author}` })
    .setDescription(welcome)
    .setColor(colors || 0x2f3136)
  if (thumbnail) welcembed.setThumbnail(thumbnail)
    .setImage(image)
    //.setThumbnail(member.user.avatarURL({ format: "png", dynamic: true, size: 4096 }))
    .setFooter({ text: `${footer}` })
  try {
    let em = await client.db.get(`embedoff_${member.guild.id}`)
    if (em) {
      if (welcome) await member.send({ content: `${member}`, embeds: [welcembed], components: [row] }).catch(() => { })
    } else {
      if (welcome) return member.send({ content: `${welcome}`, components: [row] })
    }


  } catch { }
})
client.on("guildMemberAdd", async (member) => {
  try {

    if (member.user.bot) return;

    let chx = await client.db.get(`welchannel_${member.guild.id}`);

    if (chx == null) {
      return;
    }
    let welcome = await client.db.get(`welmessage_${member.guild.id}`);
    if (welcome == null) {
      return;
    }
    let footer = await client.db.get(`welcembed_${member.guild.id}`);
    if (footer == null) {
      footer = ``
    }
    let image = await client.db.get(`image_${member.guild.id}`)
    if (image == null) {
      //image = `https://cdn.discordapp.com/attachments/989999587890712606/990905254138765362/Screenshot_7.png`
    }
    let author = await client.db.get(`author_${member.guild.id}`)
    if (author == null) {
      author = ""
    }
    let colors = await client.db.get(`color_${member.guild.id}`)
    if (colors == null) {
      colors = 0x2f3136;
    }
    let thumbnail = await client.db.get(`thumbnail_${member.guild.id}`)
    if (thumbnail == null) {
      thumbnail = ` `
    }
    if (thumbnail === '')
      if (thumbnail) thumbnail = thumbnail.replace('{user.icon}', member.user.displayAvatarURL({ dynamic: true }));
    if (thumbnail) thumbnail = thumbnail.replace('{guild.icon}', member.guild.iconURL({ dynamic: true }));
    if (image) image = image.replace('{user.icon}', member.user.displayAvatarURL({ dynamic: true }));
    if (image) image = image.replace('{guild.icon}', member.guild.iconURL({ dynamic: true }));


    welcome = welcome.replace('{user}', member);
    welcome = welcome.replace('{user.name}', member.user.username);
    welcome = welcome.replace('{user.tag}', member.user.tag);
    welcome = welcome.replace('{user.id}', member.user.id);
    welcome = welcome.replace('{membercount}', member.guild.memberCount);
    const ordinal = (member.guild.memberCount.toString().endsWith(1) && !member.guild.memberCount.toString().endsWith(11)) ? 'st' : (member.guild.memberCount.toString().endsWith(2) && !member.guild.memberCount.toString().endsWith(12)) ? 'nd' : (member.guild.memberCount.toString().endsWith(3) && !member.guild.memberCount.toString().endsWith(13)) ? 'rd' : 'th';
    welcome = welcome.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
    welcome = welcome.replace('{guild.name}', member.guild.name);
    welcome = welcome.replace('{guild.id}', member.guild.id);

    footer = footer.replace('{user}', member);
    footer = footer.replace('{user.name}', member.username);
    footer = footer.replace('{user.name}', member.username);
    footer = footer.replace('{user.id}', member.id);
    footer = footer.replace('{membercount}', member.guild.memberCount);
    footer = footer.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
    footer = footer.replace('{guild.name}', member.guild.name);
    footer = footer.replace('{guild.id}', member.guild.id);

    author = author.replace('{user}', member.member);
    author = author.replace('{user.name}', member.username);
    author = author.replace('{user.name}', member.username);
    author = author.replace('{user.id}', member.id);
    author = author.replace('{membercount}', member.guild.memberCount);
    author = author.replace('{membercount.ordinal}', member.guild.memberCount + ordinal);
    author = author.replace('{guild.name}', member.guild.name);
    author = author.replace('{guild.id}', member.guild.id);


    let welcembed = new EmbedBuilder()
      .setAuthor({ name: `${author}` })
      .setDescription(welcome)
      .setColor(colors || 0x2f3136)
    if (thumbnail) welcembed.setThumbnail(thumbnail)
      .setImage(image || await client.db.get(`image_${member.guild.id}`))
      //.setThumbnail(member.user.avatarURL({ format: "png", dynamic: true, size: 4096 }))
      .setFooter({ text: `${footer}` })

    let em = await client.db.get(`embedoff_${member.guild.id}`)
    if (em) {
      if (welcome) await client.channels.cache.get(chx).send({ content: `${member}`, embeds: [welcembed] }).catch(() => { })
    } else {
      if (welcome) return client.channels.cache.get(chx).send({ content: `${welcome}` })
    }


  } catch { }
  //console

  //  if (welcome) await client.channels.cache.get(chx).send({content:`${member}`,embeds:[welcembed]}).catch(() => {})
})
client.on("guildMemberAdd", async (member) => {


  let antibot = await client.db.get(`anti-bot_${member.guild.id}`)
  if (!member.user.bot) return;

  if (antibot !== true) return;


  member.guild.members.kick(member.id, "Anti Bot");


})






client.on("guildMemberAdd", async (member) => {

  try {
    if (!member.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd }).catch(() => {/*Ignore error*/ })

    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;
      if (executor.id == null) return;

      let antinuke = await client.db.get(`anti-new_${member.guild.id}`)
      let chx = await client.db.get(`logs_${member.guild.id}`);
      if (chx) {
        if (!member.user.bot) return;
        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Added a Bot Integration : ${target.username}  `,
              color: color,

            }
          ]
        })
      }
      if (executor.id === member.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antibotadd = await client.db.get(`antibotadd_${member.guild.id}`)
      if (antibotadd !== true) return;

      if (target.id !== member.user.id) return;


      let trustedusers = await client.db.get(`trustedusers_${member.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }

      member.guild.members.ban(executor.id, {
        reason: "Anti Bot Add"
      }).catch(() => {/*Ignore error*/ })
      member.guild.members.kick(target.id, "illegal bot").catch(() => {/*Ignore error*/ })
    } else if (!logs) return;
  } catch { }
})
client.on("channelCreate", async (channel) => {
  try {

    if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await channel.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.ChannelCreate }).catch(() => {/*Ignore error*/ })
    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;
      let chx = await client.db.get(`logs_${channel.guild.id}`);
      if (chx) {
        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Created Channel : <#${channel.id}>  `,
              color: color,

            }
          ]
        })
      }
      if (executor.id == null) return;
      let antinuke = await client.db.get(`anti-new_${channel.guild.id}`)
      if (executor.id === channel.guild.ownerId) return;
      if (executor.id === client.user.id) return;

      if (antinuke !== true) return;
      let antichannelcreate = await client.db.get(`antichannelcreate_${channel.guild.id}`)
      if (antichannelcreate !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${channel.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }
      channel.delete().catch(() => {/*Ignore error*/ })
      channel.guild.members.ban(executor.id, {
        reason: "Anti Channel Create"
      }).catch(() => {/*Ignore error*/ })

    } else if (!logs) return;
  } catch { }
})
client.on("channelDelete", async (channel) => {

  try {
    if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await channel.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.ChannelDelete });
    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;
      let chx = await client.db.get(`logs_${channel.guild.id}`);
      if (chx) {
        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Deleted Channel : ${channel.name}  `,
              color: color,

            }
          ]
        })
      }
      if (executor.id == null) return;
      let antinuke = await client.db.get(`anti-new_${channel.guild.id}`)
      if (executor.id === channel.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antichanneldelete = await client.db.get(`antichanneldelete_${channel.guild.id}`)
      if (antichanneldelete !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${channel.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }
      channel.clone().catch(() => {/*Ignore error*/ })
      channel.guild.members.ban(executor.id, {
        reason: "Anti Channel Delete"
      }).catch(() => {/*Ignore error*/ })
    } else if (!logs) return;


  } catch { }
})

client.on("channelUpdate", async (o, n) => {
  try {
    if (!o.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await n.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.ChannelUpdate });
    const logs = auditLogs.entries.first();
    if (!logs) return;
    const { executor, target } = logs;
    if (executor, target == null) return;

    let antinuke = await client.db.get(`anti-new_${o.guild.id}`)
    let chx = await client.db.get(`logs_${o.guild.id}`);
    if (chx) {
      client.channels.cache.get(chx).send({
        embeds: [
          {
            description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Updated Channel : ${o.name} | <#${n.id}> `,
            color: color,

          }
        ]
      })
    }
    if (executor.id === o.guild.ownerId) return;
    if (executor.id === client.user.id) return;
    if (antinuke !== true) return;
    let antichanneldelete = await client.db.get(`antichannelupdate_${o.guild.id}`)
    if (antichanneldelete !== true) return;
    let trustedusers = await client.db.get(`trustedusers_${o.guild.id}`)
    if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
      return;
    }

    const oldName = o.name;
    const newName = n.name;


    n.guild.members.ban(executor.id, {
      reason: "Anti Channel Update"
    }).catch(() => {/*Ignore error*/ })

    if (oldName !== newName) {
      await n.edit({
        name: oldName
      })
    }

    if (n.isTextBased()) {
      const oldTopic = o.topic;
      const newTopic = n.topic;
      if (oldTopic !== newTopic) {
        await n.setTopic(oldTopic).catch(() => {/*Ignore error*/ })
      }
    }
  } catch { }
});



const bannedUsers = new Array();
client.on("guildBanAdd", async (member) => {
  try {

    if (!member.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await member.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.MemberBanAdd });
    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;
      let antinuke = await client.db.get(`anti-new_${member.guild.id}`)
      let chx = await client.db.get(`logs_${member.guild.id}`);
      if (chx) {
        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Banned ${target.username} `,
              color: color,

            }
          ]
        })
      }
      if (executor.id === member.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antiban = await client.db.get(`antiban_${member.guild.id}`)
      if (antiban !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${member.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }
      bannedUsers.push(target.id);
      //member.guild.members.unban(target.id);

      member.guild.members.ban(executor.id, {
        reason: "Anti Member Ban"
      }).catch(() => { })

      bannedUsers.forEach(async ban => {
        await member.guild.members.unban(ban).catch(() => { })
      }).catch(() => {/*Ignore error*/ })


    } else if (!logs) return;
  } catch { }
})

client.on("guildDelete", (guild) => {
  console.log(`Left guild: ${guild.name} (${guild.id})`);
});

client.on("guildMemberRemove", async (member) => {



  try {

    const auditLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberKick,
    }).catch(() => { })

    const logs = auditLogs.entries.first()
    if (logs) {

      const { executor, target } = logs
      if (executor.id == null) return;
      let chx = await client.db.get(`logs_${member.guild.id}`);
      if (chx) {
        if (member.user.id == target.id) {


          client.channels.cache.get(chx).send({
            embeds: [
              {
                description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Kicked ${target.username} `,
                color: color,

              }
            ]
          })
        }
      }
      if (Date.now() - logs.createdTimestamp > 2000) return
      let antinuke = await client.db.get(`anti-new_${member.guild.id}`)
      if (executor.id === member.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antiban = await client.db.get(`antikick_${member.guild.id}`)
      if (antiban !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${member.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }

      member.guild.members.ban(executor.id, {
        reason: "Anti Member Kick"
      });
    }
  } catch { }
})

client.on("roleCreate", async (role) => {
  try {
    if (!role.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await role.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.RoleCreate });
    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;
      let chx = await client.db.get(`logs_${role.guild.id}`);
      if (chx) {

        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Created a Role ${role.name}`,
              color: color,

            }
          ]
        })
      }
      let antinuke = await client.db.get(`anti-new_${role.guild.id}`)
      if (executor.id === role.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antirolecreate = await client.db.get(`antirolecreate_${role.guild.id}`)
      if (antirolecreate !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${role.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }
      if (role.managed) return;

      role.delete().catch(() => {/*Ignore error*/ })
      role.guild.members.ban(executor.id, {
        reason: "Anti Role Create"
      }).catch(() => {/*Ignore error*/ })
    }
  } catch { }
})
client.on("roleDelete", async (role) => {
  try {
    if (!role.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await role.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.RoleDelete });
    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;


      let antinuke = await client.db.get(`anti-new_${role.guild.id}`)
      let chx = await client.db.get(`logs_${role.guild.id}`);
      if (chx) {

        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Deleted a Role ${role.name}`,
              color: color,

            }
          ]
        })
      }
      if (executor.id === role.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antirolecreate = await client.db.get(`antiroledelete_${role.guild.id}`)
      if (antirolecreate !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${role.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }
      if (role.managed) return;

      role.guild.roles.create({
        name: role.name,
        color: role.color,
      }).catch(() => {/*Ignore error*/ })
      role.guild.members.ban(executor.id, {
        reason: "Anti Role Delete"
      }).catch(() => {/*Ignore error*/ })
    }
  } catch { }
})
client.on("roleUpdate", async (o, n) => {
  try {
    if (!o.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await n.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.RoleUpdate });
    const logs = auditLogs.entries.first();
    const { executor, target } = logs;


    let antinuke = await client.db.get(`anti-new_${o.guild.id}`)
    let chx = await client.db.get(`logs_${o.guild.id}`);
    if (chx) {

      client.channels.cache.get(chx).send({
        embeds: [
          {
            description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳ Updated a Role : ${o.name} || ${n.name} `,
            color: color,

          }
        ]
      })
    }
    if (executor.id === n.guild.ownerId) return;
    if (executor.id === client.user.id) return;
    if (antinuke !== true) return;
    let antirolecreate = await client.db.get(`antiroleupdate_${o.guild.id}`)
    if (antirolecreate !== true) return;
    let trustedusers = await client.db.get(`trustedusers_${o.guild.id}`)
    if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
      return;
    }


    n.setPermissions(o.permissions).catch(() => { })
    n.setName(o.name).catch(() => {/*Ignore error*/ })
    n.guild.members.ban(executor.id, {
      reason: "Anti Role Update"
    }).catch(() => {/*Ignore error*/ })
  } catch { }
});

client.on("guildMemberUpdate", async (o, n) => {
  try {
    if (!o.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await o.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate });
    const logs = auditLogs.entries.first();
    const { executor, target } = logs;



    let antinuke = await client.db.get(`anti-new_${o.guild.id}`)
    let chx = await client.db.get(`logs_${o.guild.id}`);
    if (chx) {

      client.channels.cache.get(chx).send({
        embeds: [
          {
            description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n Uptaded roles for ${target.username} | ${target.tag} `,
            color: color,

          }
        ]
      })
    }
    if (executor.id === o.guild.ownerId) return;
    if (executor.id === client.user.id) return;
    if (antinuke !== true) return;
    let antirolemember = await client.db.get(`antirolemember_${o.guild.id}`)
    if (antirolemember !== true) return;
    let trustedusers = await client.db.get(`trustedusers_${o.guild.id}`)
    if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
      return;
    }

    const oldRoles = o.roles;
    const newRoles = n.roles;

    console.log(n.roles)
    if (oldRoles !== newRoles) {
      n.edit({
        roles: o.roles
      }).catch(() => { })

      n.guild.members.ban(executor.id, {
        reason: `Anti Member Role Update`
      }).catch(() => { })
    }
  } catch { }
});
client.on("webhookUpdate", async (webhook) => {
  try {
    if (!webhook.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await webhook.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.WebhookCreate })

    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;
      let chx = await client.db.get(`logs_${webhook.guild.id}`);
      if (chx) {
        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳  Created a Webhook  `,
              color: color,

            }
          ]
        })
      }
      let antinuke = await client.db.get(`anti-new_${webhook.guild.id}`)
      if (executor.id === webhook.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antiwebhookcreate = await client.db.get(`antiwebhookcreate_${webhook.guild.id}`)
      if (antiwebhookcreate !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${webhook.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }

      //webhook.delete()

      webhook.guild.members.ban(executor.id, {
        reason: "Anti Webhook Create"
      }).catch(() => { })
      const hooks1 = await webhook.guild.fetchWebhooks();

      hooks1.map(web => {
        if (web) web.delete()
      })

    }
  } catch { }
})
client.on("webhookUpdate", async (webhook) => {
  try {
    if (!webhook.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLogs = await webhook.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.WebhookUpdate });

    const logs = auditLogs.entries.first();
    if (logs) {
      const { executor, target } = logs;
      let antinuke = await client.db.get(`anti-new_${webhook.guild.id}`)
      let chx = await client.db.get(`logs_${webhook.guild.id}`);
      if (chx) {
        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳  Updated a Webhook  `,
              color: color,

            }
          ]
        })
      }
      if (executor.id === webhook.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antiwebhookupdate = await client.db.get(`antiwebhookupdate_${webhook.guild.id}`)
      if (antiwebhookupdate !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${webhook.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }

      webhook.guild.members.ban(executor.id, {
        reason: "Anti Webhook Update"
      }).catch(() => { })
    }
  } catch { }
})
client.on("webhookUpdate", async (webhook) => {
  try {
    if (!webhook.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;
    const auditLog = await webhook.guild.fetchAuditLogs({ limit: 2, type: AuditLogEvent.WebhookDelete });
    const logs = auditLog.entries.first();
    if (logs) {
      const { executor, target } = logs;
      let chx = await client.db.get(`logs_${webhook.guild.id}`);
      if (chx) {
        client.channels.cache.get(chx).send({
          embeds: [
            {
              description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳  Deleted a Webhook  `,
              color: color,

            }
          ]
        })
      }
      let antinuke = await client.db.get(`anti-new_${webhook.guild.id}`)

      if (executor.id === webhook.guild.ownerId) return;
      if (executor.id === client.user.id) return;
      if (antinuke !== true) return;
      let antiwebhookupdate = await client.db.get(`antiwebhookdelete_${webhook.guild.id}`)
      if (antiwebhookupdate !== true) return;
      let trustedusers = await client.db.get(`trustedusers_${webhook.guild.id}`)
      if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
        return;
      }

      webhook.guild.members.ban(executor.id, {
        reason: "Anti Webhook Delete"
      }).catch(() => { })

    }
  } catch { }





});

client.on("guildCreate", async (guild) => {
  let bled = await client.db.get(`blacklistedguild${guild.id}`)
  if (bled === true) {
    return guild.leave()
  }
  console.log(`Joined guild: ${guild.name} (${guild.id})`);
})


// Anti Server Update
client.on("guildUpdate", async (o, n) => {
  let antinuke = await client.db.get(`vanityURL_${n.id}`)
  if (antinuke !== true) return;

  const auditLogs = await n.fetchAuditLogs({ limit: 3, type: AuditLogEvent.GuildUpdate });
  const logs = auditLogs.entries.first();

  const { executor, target } = logs;
  let chx = await client.db.get(`logs_${o.guild.id}`);
  if (chx) {
    client.channels.cache.get(chx).send({
      embeds: [
        {
          description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳  Updated Server Vanity : ${o.vanityURLCode} | ${n.vanityURLCode} `,
          color: error,

        }
      ]
    })
  }
  if (executor.id === o.ownerId) return;
  if (executor.id === client.user.id) return;
  let trustedusers = await client.db.get(`vanitytrusted_${n.id}`)
  if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
    return;
  }
  if (o.features.includes('VANITY_URL') && n.features.includes('VANITY_URL')) {
    let vanity = await client.db.get(`vanity_${n.id}`)
    const oldVanityCode = o.vanityURLCode;
    const newVanityCode = n.vanityURLCode;


    if (oldVanityCode !== newVanityCode) {
      request({
        method: 'PATCH',
        url: `https://discord.com/api/v10/guilds/${n.id}/vanity-url`,
        json: true,
        headers: {
          "accept": "*/*",
          "Content-Type": 'application/json',
          "Authorization": `Bot ${client.token}`
        },
        json: {
          "code": `${vanity}`
        },
      }, (err, res, bod) => {
        if (err) return;
      })
    }

    n.members.ban(executor.id, {
      reason: "Anti Vanity Update"
    }).catch(() => { })
  }

})
client.on("guildUpdate", async (o, n) => {
  try {
    const auditLogs = await n.fetchAuditLogs({ limit: 3, type: AuditLogEvent.GuildUpdate });
    const logs = auditLogs.entries.first();

    const { executor, target } = logs;

    let antinuke = await client.db.get(`anti-new_${n.id}`)
    let chx = await client.db.get(`logs_${o.guild.id}`);
    if (chx) {
      client.channels.cache.get(chx).send({
        embeds: [
          {
            description: `**Mod Logs** 🔨 \n\n ↳ ${executor.tag} \n ↳  Updated Server settings \n\n ↳ Server Name : ${o.name} | ${n.name} `,
            color: color,

          }
        ]
      })
    }
    if (executor.id === o.ownerId) return;
    if (executor.id === client.user.id) return;
    if (antinuke !== true) return;
    let antiguild = await client.db.get(`antiguildupdate_${o.guild.id}`)
    if (antiguild !== true) return;
    let trustedusers = await client.db.get(`trustedusers_${n.id}`)

    if (trustedusers && trustedusers.find(find => find.user == executor.id)) {
      return;
    }
    const oldIcon = o.iconURL();
    const oldName = o.name;

    const newIcon = n.iconURL();
    const newName = n.name;

    if (oldName !== newName) {
      await n.setName(oldName);
    }

    if (oldIcon !== newIcon) {
      await n.setIcon(oldIcon);
    }

    // Anti Vanity URL Snipe Suggested By ShadowTW
    if (o.features.includes('VANITY_URL') && n.features.includes('VANITY_URL')) {
      let vanity = await client.db.get(`vanity_${n.id}`)
      const oldVanityCode = o.vanityURLCode;
      const newVanityCode = n.vanityURLCode;

      if (oldVanityCode !== newVanityCode) {
        request({
          method: 'PATCH',
          url: `https://discord.com/api/v10/guilds/${n.id}/vanity-url`,
          json: true,
          headers: {
            "accept": "*/*",
            "Content-Type": 'application/json',
            "Authorization": `Bot ${client.token}`
          },
          json: {
            "code": `${vanity}`
          },
        }, (err, res, bod) => {
          if (err) return;
        })
      }
    }

    if (!n.equals(o)) {
      n.edit({
        features: o.features
      });
    }

    if (!o.features.includes('COMMUNITY') && n.features.includes('COMMUNITY')) {
      n.edit({
        features: o.features
      });

      for (let x = 0; x <= 3; x++) {
        n.channels.cache.forEach((c) => {
          if (c.name === 'rules') {
            c.delete();
          } else if (c.name === 'moderator-only') {
            c.delete();
          }
        })
      }
    }
    n.members.ban(executor.id, {
      reason: "Anti Guild Update"
    });
  } catch { }
});

client.on('messageReactionAdd', async (reaction, user) => {
  let enabled = await client.db.get(`starboard_${reaction.message.guild.id}`)
  let toCount = await client.db.get(`starthreshold${reaction.message.guild.id}`)
  if (toCount > reaction.count) return;
  const handleStarboard = async () => {
    // const starboard = client.channels.cache.find(channel => channel.name.toLowerCase() === 'starboard');
    const starboard = client.channels.cache.get(enabled);
    const msgs = await starboard.messages.fetch({ limit: 100 });
    const existingMsg = msgs.find(msg =>
      msg.embeds.length === 1 ?
        (msg.embeds[0].footer.text.startsWith(reaction.message.id) ? true : false) : false);
    if (existingMsg) {
      existingMsg.edit(`${reaction.count} - ⭐`);
    }
    else {

      const row = new ActionRowBuilder()

        .addComponents(
          new ButtonBuilder()
            .setLabel('Message Link')
            .setEmoji("🔗 ")
            .setURL(`${reaction.message.url}`)
            .setStyle(ButtonStyle.Link),
        )
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${reaction.message.author.tag}`, iconURL: `${reaction.message.author.displayAvatarURL()}` })
        // .addField('Url', reaction.message.url)
        .setDescription(reaction.message.content)
        .setColor(color)
        .setFooter({ text: `${reaction.count} - ⭐` })


      if (starboard)
        starboard.send({ content: `${reaction.count} - ⭐`, embeds: [embed], components: [row] });
    }
  }
  if (reaction.emoji.name === '⭐') {
    if (reaction.message.partial) {
      await reaction.fetch();
      await reaction.message.fetch();
      handleStarboard();
    }
    else
      handleStarboard();
  }

});
client.on('messageReactionRemove', async (reaction, user) => {
  let enabled = await client.db.get(`starboard_${reaction.message.guild.id}`)
  let toCount = await client.db.get(`starthreshold${reaction.message.guild.id}`)
  if (toCount > reaction.count) return;
  const handleStarboard = async () => {
    // const starboard = client.channels.cache.find(channel => channel.name.toLowerCase() === 'starboard');
    const starboard = client.channels.cache.get(enabled);
    const msgs = await starboard.messages.fetch({ limit: 100 });
    const existingMsg = msgs.find(msg =>
      msg.embeds.length === 1 ?
        (msg.embeds[0].footer.text.startsWith(reaction.message.id) ? true : false) : false);

    if (existingMsg) {
      console.log(existingMsg)
      existingMsg.edit(`${reaction.count} - ⭐`);
      return;
    }
    else {

      const row = new ActionRowBuilder()

        .addComponents(
          new ButtonBuilder()
            .setLabel('Message Link')
            .setEmoji("🔗 ")
            .setURL(`${reaction.message.url}`)
            .setStyle(ButtonStyle.Link),
        )
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${reaction.message.author.tag}`, iconURL: `${reaction.message.author.displayAvatarURL()}` })
        // .addField('Url', reaction.message.url)
        .setDescription(reaction.message.content)
        .setColor(color)
        .setFooter({ text: `${reaction.count} - ⭐` })


      if (starboard)
        starboard.send({ content: `${reaction.count} - ⭐`, embeds: [embed], components: [row] });
    }
  }
  if (reaction.emoji.name === '⭐') {
    if (reaction.message.channel.name.toLowerCase() === 'starboard') return;
    if (reaction.message.partial) {
      await reaction.fetch();
      await reaction.message.fetch();
      handleStarboard();
    }
    else
      handleStarboard();
  }

});















process.on("uncaughtException", (err) => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
  console.log(`Uncaught Exception: ${errorMsg}`);
  console.error(err);
  process.exit(1);
});

process.on("unhandledRejection", err => {
  console.log(`Unhandled rejection: ${err}`);
  console.error(err);
});

//client.login(token);
client.login(token)
