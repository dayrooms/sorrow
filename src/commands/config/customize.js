const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');

/**
 * `customize` — per-server bot appearance for admins.
 *
 * Discord limits per-SERVER bot appearance to the NICKNAME. A bot's avatar,
 * banner and bio are a single GLOBAL profile shared across every server, so
 * those are owner-only (`;dev setavatar` / `setbanner` / `setusername`) and
 * cannot differ per server. This command sets the per-server nickname and
 * explains that clearly.
 */
module.exports = new Command({
  name: 'customize',
  aliases: ['botconfig', 'botappearance'],
  category: 'config',
  description: "Customize the bot's nickname in this server.",
  permLevel: LEVELS.ADMIN,
  usage: 'nick <name> | resetnick | view',
  botPerms: [PermissionFlagsBits.ChangeNickname],
  help: {
    title: "Bot appearance in this server",
    intro:
      "Set the bot's nickname for THIS server. Note: Discord only allows a bot's *nickname* to differ per server — its avatar, banner and username are one global profile (owner-only via `;dev setavatar` / `setbanner` / `setusername`).",
    subcommands: [
      { usage: 'nick <name>', desc: "Set the bot's nickname in this server.", example: 'nick Sorrow' },
      { usage: 'resetnick', desc: 'Reset the nickname back to the default.' },
      { usage: 'view', desc: 'Show the current nickname.' },
    ],
  },
  async run({ client, message, args, prefix, sub }) {
    const me = message.guild.members.me;

    switch (sub) {
      case 'nick':
      case 'nickname': {
        const nick = args.slice(1).join(' ');
        if (!nick) return message.reply({ embeds: [error(`Usage: \`${prefix}customize nick <name>\``)] });
        if (nick.length > 32) return message.reply({ embeds: [error('Nickname must be 32 characters or fewer.')] });
        try {
          await me.setNickname(nick, `Customized by ${message.author.tag}`);
          return message.reply({ embeds: [success(message.author, `My nickname here is now **${nick}**.`)] });
        } catch {
          return message.reply({ embeds: [error("I couldn't change my nickname — check that I have **Change Nickname** and my role is high enough.")] });
        }
      }
      case 'resetnick': {
        await me.setNickname(null, `Reset by ${message.author.tag}`).catch(() => {});
        return message.reply({ embeds: [success(message.author, 'Reset my nickname to the default.')] });
      }
      case 'view':
      default:
        return message.channel.send({
          embeds: [
            base()
              .setTitle('Bot appearance')
              .setThumbnail(client.user.displayAvatarURL())
              .setDescription(
                [
                  `**Nickname here:** ${me.nickname || '(default)'}`,
                  '',
                  `\`${prefix}customize nick <name>\` — set a per-server nickname`,
                  `\`${prefix}customize resetnick\` — clear it`,
                  '',
                  '*Avatar, banner and username are a single global profile and can only be changed by the bot owner.*',
                ].join('\n')
              ),
          ],
        });
    }
  },
});
