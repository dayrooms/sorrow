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
  name: "antivanity",
  description: "protects your vanity from getting stolen",
  aliases: ["vanity"],
  usage:
    " ```YAML\n\n antivanity [on/off], \n antivanity whitelist, \n antivanity blacklist, \n antivanity whitelisted, ``` ",
    category: "security",
  guildOnly: false,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  execute: async (message, args, client) => {
    const db = client.db;
    // Unified whitelist + help subcommands (short and full forms both work)
    const sub = args[0] ? args[0].toLowerCase() : null;
    if (sub === 'whitelist' || sub === 'wl' || sub === 'add' || sub === 'remove') {
      // bare 'add'/'remove' are shorthand for 'whitelist add'/'whitelist remove'
      const delegateArgs = (sub === 'add' || sub === 'remove') ? args : args.slice(1);
      const whitelistCmd = client.commands.get('whitelist');
      return whitelistCmd.execute(message, delegateArgs, client);
    }
    if (sub === 'help' || sub === 'h') {
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle('🛡️ antivanity Help')
        .setDescription('`;antivanity on` — enable\n`;antivanity off` — disable\n`;antivanity whitelist add @user` / `;antivanity wl add @user`\n`;antivanity whitelist remove @user` / `;antivanity wl remove @user`')
        .setColor(color)] });
    }

    if (talkedRecently.has(message.author.id)) {
      message.react(`⌛`);
    } else {
      let vanity = await db.get(`vanity_${message.guild.id}`);
      if (vanity == null) {
        vanity = `Not Set`;
      }

      let onlyown = new EmbedBuilder()
        .setDescription(`${xmark} Only server owner can use this command`)
        .setColor(error);

      let aenabled = new EmbedBuilder()
        .setDescription(`${checked} Antivanity is now enabled`)
        .setColor(color);
      let missperms = new EmbedBuilder()
        .setDescription(`${xmark} You're missing perms`)
        .setColor(error);

      let nukeable = new EmbedBuilder()
        .setDescription(`${checked}  Antivanity Enabled`)
        .setColor(color);

      const authorized = [message.guild.ownerId, owner];
      if(message.author.id !== message.guild.ownerId) return message.channel.send({embeds:[onlyown]});
    //  if (!authorized.includes(authorized)) return message.reply({ embeds: [onlyown] }).catch(() => {/*Ignore error*/});

      if (args[0] === "set") {
        let vanity = message.guild.vanityURLCode;
        await db.set(`vanity_${message.guild.id}`, vanity);
        let vanit = new EmbedBuilder()
          .setDescription(`${checked} Updated Vanity to ${vanity}`)
          .setColor(color);

        message.reply({ embeds: [vanit] });
      } else if (args[0] === "off") {
        let disabled = new EmbedBuilder()
          .setDescription(`${checked}  Antivanity is now disabled`)
          .setColor(color);

        if ((await await db.has(`vanityURL_${message.guild.id}`)) === true) {
          await await db.delete(`vanityURL_${message.guild.id}`);
          message.reply({ embeds: [disabled] }).catch(() => {
            /*Ignore error*/
          });
        }
      } else if (args[0] === "on") {
        if ((await await db.has(`vanityURL_${message.guild.id}`)) === false) {
          await await db.set(`vanityURL_${message.guild.id}`, true);
          message.reply({ embeds: [nukeable] }).catch(() => {
            /*Ignore error*/
          });
        } else
          return message.reply({ embeds: [aenabled] }).catch(() => {
            /*Ignore error*/
          });
      } else if (args[0] == "info") {
        let vanity = await db.get(`vanity_${message.guild.id}`);
        if (vanity == null) {
          vanity = `There's no vanity set`;
        }
        let embed11 = new EmbedBuilder()

          .setDescription(
            `🛡️  Sorrow Vanity Protection \n • antivanity on - toggles antivanity event on \n • antivanity off - toggles antivanity event off \n • antivanity set - locks current server vanity`
          )
          .setThumbnail(client.user.displayAvatarURL())
          .setColor(color);

        message.reply({ embeds: [embed11] }).catch(() => {
          /*Ignore error*/
        });
      }
      if (!args[0]) {
        let checkenable = new EmbedBuilder()

          .setDescription(
            `🟢 Antivanity Is Enabled VanityURL  - ${vanity} \n Usage : \n • antivanity [on/off] \n • Set vanity by running antivanity set then set antivanity on \n • antivanity whitelist \n • antivanity blacklist`
          )
          .setColor(color);
        let checkdisabled = new EmbedBuilder()
          .setDescription(
            `🔴  Antivanity Is Disabled VanityURL  - ${vanity} \n Usage : \n • antivanity [on/off] \n • Set vanity by running antivanity set then set antivanity on \n • antivanity whitelist \n • antivanity blacklist`
          )
          .setColor(color);
        let antinuke = await db.get(`vanityURL_${message.guild.id}`);
        if (antinuke !== true) {
          return message.reply({ embeds: [checkdisabled] }).catch(() => {
            /*Ignore error*/
          });
        } else if (antinuke === true) {
          return message.reply({ embeds: [checkenable] }).catch(() => {
            /*Ignore error*/
          });
        }
      } else if (args[0] === "whitelist") {
        let antinuke = await db.get(`vanityURL_${message.guild.id}`);

        let onlyown = new EmbedBuilder()
          .setDescription(`${xmark} Only server owner can use this command`)
          .setColor(error);

       // const authorized = [message.guild.ownerId, owner];
        if(message.author.id !== message.guild.ownerId) return message.channel.send({embeds:[onlyown]});
        //if (!authorized.includes(authorized)) return message.reply({ embeds: [onlyown] });
        if (antinuke !== true) {
          return message.reply({ content: `Enable Antivanity First` });
        }
        let user =
          message.mentions.users.first() ||
          message.guild.members.cache.get(args[1]);
        if (!user) {
          let usermention = new EmbedBuilder()
            .setDescription(
              `
            ${xmark}  Mention user to whitelist
            `
            )
            .setColor(error);

          return message.reply({
            embeds: [usermention],
          });
        }
        let trustedusers = await db.get(`vanitytrusted_${message.guild.id}`);
        if (trustedusers && trustedusers.find((find) => find.user == user.id)) {
          let trust = new EmbedBuilder()
            .setColor(error)
            .setDescription(`${xmark}  That user is already whitelisted`);
          return message.reply({ embeds: [trust] });
        }
        let data = {
          user: user.id,
        };
        await db.push(`vanitytrusted_${message.guild.id}`, data);
        let added = new EmbedBuilder()
          .setDescription(
            `
        ${checked}  Vanity Whitelisted ${user}
        `
          )
          .setColor(color);

        return message.reply({
          embeds: [added],
        });
      } else if (args[0] === "blacklist") {
        let antinuke = await db.get(`vanityURL_${message.guild.id}`);
        let onlyown = new EmbedBuilder()
          .setDescription(`${xmark} Only server owner can use this command`)
          .setColor(error);

       // const authorized = [message.guild.ownerId, owner];
        if(message.author.id !== message.guild.ownerId) return message.channel.send({embeds:[onlyown]});
        //if (!authorized.includes(authorized))
        //  return message.reply({ embeds: [onlyown] });
        if (antinuke !== true) {
          return message.reply({ content: `Enable Antinuke First` });
        }
        let user =
          (await message.mentions.members.first()) ||
          message.guild.members.cache.get(args[1]) ||
          args[0];
        if (!user) {
          let usermention = new EmbedBuilder()
            .setDescription(`${xmark}  Mention a user/ID`)
            .setColor(error);
          return message.reply({
            embeds: [usermention],
          });
        }

        let database = await db.get(`vanitytrusted_${message.guild.id}`);
        if (database) {
          let data = database.find((x) => x.user === user.id);
          let unabletofind = new EmbedBuilder()
            .setDescription(
              `${xmark}  Could not find that user in the database`
            )
            .setColor(error);
          if (!data) return message.reply({ embeds: [unabletofind] });

          let value = database.indexOf(data);
          delete database[value];

          var filter = database.filter((x) => {
            return x != null && x != "";
          });

          await db.set(`vanitytrusted_${message.guild.id}`, filter);
          let deleted = new EmbedBuilder()
            .setDescription(`${checked} Removed ${user} From Vanity Whitelist.`)
            .setColor(color);

          return message.reply({
            embeds: [deleted],
          });
        } else {
          let notrust = new EmbedBuilder()
            .setDescription(`${xmark}  That user is not whitelisted`)
            .setColor(error);
          message.reply({ embeds: [notrust] });
        }
      } else if (args[0] === "whitelisted") {
        let errors = new EmbedBuilder()
          .setDescription(`${xmark} There are no whitelisted users`)
          .setColor(error);

        let onlyown = new EmbedBuilder()
          .setDescription(`${xmark} Only server owner can use this command`)
          .setColor(error);

        const authorized = [message.guild.ownerId, owner];
        if(message.author.id !== message.guild.ownerId) return message.channel.send({embeds:[onlyown]});
      //  if (!authorized.includes(authorized))
         // return message.reply({ embeds: [onlyown] });

        let guild = message.guild.iconURL();

        let wordlist = new EmbedBuilder();
        let database = await db.get(`vanitytrusted_${message.guild.id}`);
        if (database == null)
          return message
            .reply({
              content: `${xmark} there are no vanity whitelisted users`,
            })
            .catch(() => {
              /*Ignore error*/
            });
        if (database && database.length) {
          let arrayv = [];

          database.forEach((m) => {
            arrayv.push(`<@${m.user}> - ${m.user}`);
          });
          wordlist.setDescription(message.guild.name);
          wordlist.addFields({ name: "Vanity Users", value: `>  ${arrayv.join("\n> ")}` });
          wordlist.setThumbnail(message.guild.iconURL({ dynamic: true }));
          wordlist.setColor(color);
        }

        // if(database == null) return (message.reply({content:`⚠️ there are no whitelisted users`})).catch(() => {/*Ignore error*/});

        message.reply({ embeds: [wordlist] }).catch(() => {
          message.reply({ embeds: [errors] });
        });
      }

      // Adds the user to the set so that they can't talk for a minute
      talkedRecently.add(message.author.id);
      setTimeout(() => {
        // Removes the user from the set after a minute
        talkedRecently.delete(message.author.id);
      }, 3500);
    }
  },
};
