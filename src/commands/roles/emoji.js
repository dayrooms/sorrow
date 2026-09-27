const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');

const CUSTOM_EMOJI_RE = /<(a)?:(\w+):(\d+)>/;

function emojiUrlFromArg(arg) {
  const m = arg?.match(CUSTOM_EMOJI_RE);
  if (m) return { url: `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] ? 'gif' : 'png'}`, name: m[2] };
  if (/^https?:\/\//.test(arg || '')) return { url: arg, name: null };
  return null;
}

const emoji = new Command({
  name: 'emoji',
  aliases: ['e', 'emote'],
  category: 'roles',
  description: 'Manage server emojis.',
  permLevel: LEVELS.MOD,
  usage: 'add/remove/rename/addmany/info <...>',
  botPerms: [PermissionFlagsBits.ManageGuildExpressions],
  async run({ message, args, prefix, sub }) {
    switch (sub) {
      case 'add': {
        const att = message.attachments.first();
        const src = att ? { url: att.url, name: null } : emojiUrlFromArg(args[1]);
        const name = args[2] || src?.name || `emoji_${Date.now().toString().slice(-5)}`;
        if (!src) return message.reply({ embeds: [error(`Usage: \`${prefix}emoji add <emoji/url/attachment> [name]\``)] });
        const created = await message.guild.emojis.create({ attachment: src.url, name }).catch((e) => { message.reply({ embeds: [error(`Failed: ${e.message}`)] }); return null; });
        if (created) return message.reply({ embeds: [success(message.author, `Added emoji ${created} \`:${created.name}:\``)] });
        return;
      }
      case 'addmany': {
        const matches = [...message.content.matchAll(/<(a)?:(\w+):(\d+)>/g)];
        if (!matches.length) return message.reply({ embeds: [error('Provide custom emojis to add.')] });
        let n = 0;
        for (const m of matches.slice(0, 20)) {
          const url = `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] ? 'gif' : 'png'}`;
          const created = await message.guild.emojis.create({ attachment: url, name: m[2] }).catch(() => null);
          if (created) n++;
        }
        return message.reply({ embeds: [success(message.author, `Added **${n}** emoji(s).`)] });
      }
      case 'remove': {
        const m = args[1]?.match(CUSTOM_EMOJI_RE);
        const target = m ? message.guild.emojis.cache.get(m[3]) : message.guild.emojis.cache.find((e) => e.name === args[1]);
        if (!target) return message.reply({ embeds: [error('Emoji not found.')] });
        const name = target.name;
        await target.delete().catch(() => {});
        return message.reply({ embeds: [success(message.author, `Removed \`:${name}:\`.`)] });
      }
      case 'rename': {
        const m = args[1]?.match(CUSTOM_EMOJI_RE);
        const target = m ? message.guild.emojis.cache.get(m[3]) : message.guild.emojis.cache.find((e) => e.name === args[1]);
        const newName = args[2];
        if (!target || !newName) return message.reply({ embeds: [error(`Usage: \`${prefix}emoji rename <emoji> <new name>\``)] });
        await target.edit({ name: newName }).catch(() => {});
        return message.reply({ embeds: [success(message.author, `Renamed to \`:${newName}:\`.`)] });
      }
      case 'info': {
        const m = args[1]?.match(CUSTOM_EMOJI_RE);
        if (!m) return message.reply({ embeds: [error('Provide a custom emoji.')] });
        return message.channel.send({ embeds: [base().setTitle(`:${m[2]}:`).setDescription(`**ID:** ${m[3]}\n**Animated:** ${m[1] ? 'yes' : 'no'}`).setThumbnail(`https://cdn.discordapp.com/emojis/${m[3]}.${m[1] ? 'gif' : 'png'}`)] });
      }
      default:
        return message.reply({ embeds: [error(`Usage: \`${prefix}emoji add/remove/rename/addmany/info\``)] });
    }
  },
});

const sticker = new Command({
  name: 'sticker',
  category: 'roles',
  description: 'Manage server stickers.',
  permLevel: LEVELS.MOD,
  usage: 'add/remove/rename <...>',
  botPerms: [PermissionFlagsBits.ManageGuildExpressions],
  async run({ message, args, prefix, sub }) {
    switch (sub) {
      case 'add': {
        const ref = message.reference ? await message.fetchReference().catch(() => null) : null;
        const refSticker = ref?.stickers.first();
        const att = message.attachments.first();
        const url = refSticker?.url || att?.url || args[1];
        const name = args[refSticker ? 1 : 2] || `sticker_${Date.now().toString().slice(-5)}`;
        if (!url) return message.reply({ embeds: [error(`Usage: \`${prefix}sticker add <url/attachment/reply> <name>\``)] });
        const created = await message.guild.stickers.create({ file: url, name, tags: '🌟' }).catch((e) => { message.reply({ embeds: [error(`Failed: ${e.message}`)] }); return null; });
        if (created) return message.reply({ embeds: [success(message.author, `Added sticker **${created.name}**.`)] });
        return;
      }
      case 'remove': {
        const ref = message.reference ? await message.fetchReference().catch(() => null) : null;
        const target = ref?.stickers.first() ? message.guild.stickers.cache.get(ref.stickers.first().id) : message.guild.stickers.cache.find((s) => s.name === args[1]);
        if (!target) return message.reply({ embeds: [error('Sticker not found.')] });
        await target.delete().catch(() => {});
        return message.reply({ embeds: [success(message.author, 'Removed the sticker.')] });
      }
      case 'rename': {
        const ref = message.reference ? await message.fetchReference().catch(() => null) : null;
        const target = ref?.stickers.first() ? message.guild.stickers.cache.get(ref.stickers.first().id) : null;
        const newName = args[1];
        if (!target || !newName) return message.reply({ embeds: [error('Reply to a sticker message and provide a new name.')] });
        await target.edit({ name: newName }).catch(() => {});
        return message.reply({ embeds: [success(message.author, `Renamed sticker to **${newName}**.`)] });
      }
      default:
        return message.reply({ embeds: [error(`Usage: \`${prefix}sticker add/remove/rename\``)] });
    }
  },
});

const steal = new Command({
  name: 'steal',
  category: 'roles',
  description: 'Steal an emoji from another server (reply or provide emoji).',
  permLevel: LEVELS.MOD,
  usage: '[name] (reply to message with emoji, or provide emoji)',
  botPerms: [PermissionFlagsBits.ManageGuildExpressions],
  async run({ message, args }) {
    let content = message.content;
    if (message.reference) {
      const ref = await message.fetchReference().catch(() => null);
      if (ref) content = ref.content;
    }
    const m = content.match(/<(a)?:(\w+):(\d+)>/);
    if (!m) return message.reply({ embeds: [error('Reply to a message with a custom emoji, or include one.')] });
    const url = `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] ? 'gif' : 'png'}`;
    const name = args[0] || m[2];
    const created = await message.guild.emojis.create({ attachment: url, name }).catch((e) => { message.reply({ embeds: [error(`Failed: ${e.message}`)] }); return null; });
    if (created) return message.reply({ embeds: [success(message.author, `Stole ${created} as \`:${created.name}:\``)] });
  },
});

const enlarge = new Command({
  name: 'enlarge',
  aliases: ['jumbo', 'bigemoji'],
  category: 'fun',
  description: 'Enlarge a custom emoji.',
  permLevel: LEVELS.USER,
  usage: '<emoji>',
  async run({ message, args }) {
    let content = args.join(' ') || message.content;
    const m = content.match(/<(a)?:(\w+):(\d+)>/);
    if (!m) return message.reply({ embeds: [error('Provide a custom emoji.')] });
    const url = `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] ? 'gif' : 'png'}?size=512`;
    return message.channel.send({ embeds: [base().setTitle(`:${m[2]}:`).setImage(url)] });
  },
});

module.exports = [emoji, sticker, steal, enlarge];
