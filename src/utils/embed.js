const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Embed helpers so every response looks consistent and on-brand.
 *
 * Subcommand embeds "shift color automatically": pass a seed (usually the
 * subcommand name) to pickSubColor and it deterministically maps to one of
 * the rotation colors — so `role create` and `role delete` differ in hue but
 * each command keeps a stable color across uses.
 */

function pickSubColor(seed = '') {
  const rot = config.colors.rotation;
  if (!seed) return config.colors.primary;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return rot[hash % rot.length];
}

function base(color) {
  return new EmbedBuilder().setColor(color ?? config.colors.primary);
}

module.exports = {
  pickSubColor,
  base,

  /** Neutral / default embed. */
  embed: (desc, color) => base(color).setDescription(desc),

  /** Green success embed — used for confirmations. Mirrors the reference layout:
   *  a check emoji, then "@user: <message>". */
  success: (user, message) =>
    base(config.colors.success).setDescription(
      `${config.emojis.yes} ${user ? `${user}: ` : ''}${message}`
    ),

  /** Red error embed. */
  error: (message, user) =>
    base(config.colors.error).setDescription(
      `${config.emojis.no} ${user ? `${user}: ` : ''}${message}`
    ),

  /** Warning embed. */
  warn: (message, user) =>
    base(config.colors.warn).setDescription(
      `${config.emojis.warn} ${user ? `${user}: ` : ''}${message}`
    ),

  /** Titled panel embed for settings/config displays. */
  panel: (title, color) => base(color).setTitle(title),
};
