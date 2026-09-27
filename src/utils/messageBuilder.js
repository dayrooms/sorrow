const { EmbedBuilder } = require('discord.js');
const { fillVars } = require('./moderation');

/**
 * Parses a "message script" into a sendable payload.
 *
 * Supports two forms:
 *  1. Plain text (with {variables}).
 *  2. Embed script using {key: value} tokens, e.g.
 *     {title: Welcome} {description: hi {user}} {color: #ff0000} {image: url}
 *     {content: text outside embed} {thumbnail: url} {footer: text}
 *
 * Variables available: {user} {user.name} {user.tag} {user.id} {user.mention}
 *   {guild} {guild.name} {guild.count} {channel} {reason} etc.
 */
function buildMessage(script, ctx) {
  if (!script) return null;
  const filled = fillVars(script, ctx);

  // Detect embed tokens
  const tokenRe = /\{(title|description|desc|color|colour|image|thumbnail|footer|author|url|content|field):\s*([^}]*)\}/gi;
  const tokens = [...filled.matchAll(tokenRe)];
  if (!tokens.length) {
    return { content: filled.slice(0, 2000) };
  }

  const embed = new EmbedBuilder();
  let content = null;
  let hasEmbed = false;

  for (const [, key, valueRaw] of tokens) {
    const value = valueRaw.trim();
    switch (key.toLowerCase()) {
      case 'title': embed.setTitle(value.slice(0, 256)); hasEmbed = true; break;
      case 'description':
      case 'desc': embed.setDescription(value.slice(0, 4096)); hasEmbed = true; break;
      case 'color':
      case 'colour': {
        const c = parseInt(value.replace(/^#/, ''), 16);
        if (!Number.isNaN(c)) embed.setColor(c);
        hasEmbed = true;
        break;
      }
      case 'image': embed.setImage(value); hasEmbed = true; break;
      case 'thumbnail': embed.setThumbnail(value); hasEmbed = true; break;
      case 'footer': embed.setFooter({ text: value.slice(0, 2048) }); hasEmbed = true; break;
      case 'author': embed.setAuthor({ name: value.slice(0, 256) }); hasEmbed = true; break;
      case 'url': embed.setURL(value); hasEmbed = true; break;
      case 'content': content = value.slice(0, 2000); break;
      case 'field': {
        const [name, ...rest] = value.split('|');
        if (name && rest.length) embed.addFields({ name: name.trim().slice(0, 256), value: rest.join('|').trim().slice(0, 1024) });
        hasEmbed = true;
        break;
      }
      default: break;
    }
  }

  const payload = {};
  if (content) payload.content = content;
  if (hasEmbed) payload.embeds = [embed];
  if (!payload.content && !payload.embeds) payload.content = filled.slice(0, 2000);
  return payload;
}

const VARIABLE_LIST = [
  '{user} — mentions the member',
  '{user.name} — username',
  '{user.tag} — full tag',
  '{user.id} — user id',
  '{guild} / {guild.name} — server name',
  '{guild.count} — member count',
  '{channel} — current channel',
  '{reason} {moderator} {duration} — moderation context',
];

module.exports = { buildMessage, VARIABLE_LIST };
