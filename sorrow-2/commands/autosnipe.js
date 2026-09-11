const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
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
  name: "autosnipe",
  description: "auto snipes deletes message",
  aliases: [],
  usage: " ```YAML\n\n autosnipe [on/off] ``` ",
  category: "config",
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
      let checkenable = new EmbedBuilder()
        .setDescription(
          `🟢 Auto snipe is enabled `
        )
        .setColor(color);
      let checkdisabled = new EmbedBuilder()
        .setDescription(
          `🔴  Auto snipe is disabled `
        )
        .setColor(color);


      let aenabled = new EmbedBuilder()
        .setDescription(`${checked} Auto snipe is now enabled`)
        .setColor(color);
      let missperms = new EmbedBuilder()
        .setDescription(`${xmark} You're missing \`MANAGE_GUILD\` permission`)
        .setColor(error);

      let nukeable = new EmbedBuilder()
        .setDescription(`${checked}  Auto snipe enabled`)
        .setColor(color);
      if (args[0] == "on") {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
          return message.reply({ embeds: [missperms] });

        if ((await await db.has(`autosniped_${message.guild.id}`)) === false) {
          await await db.set(`autosniped_${message.guild.id}`, true);
          message.reply({ embeds: [nukeable] }).catch(() => {
            /*Ignore error*/
          });
        } else
          return message.reply({ embeds: [aenabled] }).catch(() => {
            /*Ignore error*/
          });
      } else if (args[0] == "off") {
        let disabled = new EmbedBuilder()
          .setDescription(`${checked} Auto snipe disabled`)
          .setColor(color);
        let alreadydisabled = new EmbedBuilder()
          .setDescription(`${xmark}  Auto snipe is already disabled `)
          .setColor(error);
        if ((await await db.has(`autosniped_${message.guild.id}`)) === true) {
          await await db.delete(`autosniped_${message.guild.id}`);
          message.reply({ embeds: [disabled] }).catch(() => {
            /*Ignore error*/
          });
        } else
          return message.reply({ embeds: [alreadydisabled] }).catch(() => {
            /*Ignore error*/
          });
      }
      if (!args[0]) {
        let antibot = await db.get(`autosniped_${message.guild.id}`);
        if (antibot !== true) {
          return message.reply({ embeds: [checkdisabled] }).catch(() => {
            /*Ignore error*/
          });
        } else if (antibot === true) {
          return message.reply({ embeds: [checkenable] }).catch(() => {
            /*Ignore error*/
          });
        }
      }
    }

    talkedRecently.add(message.author.id);
    setTimeout(() => {
      // Removes the user from the set after a minute
      talkedRecently.delete(message.author.id);
    }, 3500);
  },
};
