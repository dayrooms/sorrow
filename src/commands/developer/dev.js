const { inspect } = require('node:util');
const Command = require('../../structures/Command');
const { LEVELS, isBotOwner } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const db = require('../../database/db');

/**
 * Developer command suite — LOCKED to bot owner (OWNER_IDS).
 * permLevel BOT_OWNER means the dispatcher's check() already blocks everyone
 * else, but each subcommand double-checks isBotOwner for safety.
 */
module.exports = new Command({
  name: 'dev',
  aliases: ['developer', 'd'],
  category: 'developer',
  description: 'Developer/owner-only commands.',
  permLevel: LEVELS.BOT_OWNER,
  guildOnly: false,
  usage: 'help | eval | leaveguild | guilds | blacklist | servers | reload',
  async run({ client, message, args, prefix, sub }) {
    if (!isBotOwner(message.author.id)) return; // hard gate

    switch (sub) {
      case '':
      case 'help':
        return message.channel.send({
          embeds: [
            base(client.config.colors.accent)
              .setTitle('🛠️ Developer Commands')
              .setDescription(
                [
                  `\`${prefix}dev eval <code>\` — run JavaScript`,
                  `\`${prefix}dev guilds\` — list servers (count + names)`,
                  `\`${prefix}dev leaveguild <id>\` — leave a server`,
                  `\`${prefix}dev servers\` — server list with member counts`,
                  `\`${prefix}dev blacklist <userId>\` — block a user from the bot`,
                  `\`${prefix}dev unblacklist <userId>\``,
                  `\`${prefix}dev blacklisted\` — list blocked users`,
                  `\`${prefix}dev reload\` — hot-reload all commands`,
                  `\`${prefix}dev setstatus <text>\` — set the bot's presence`,
                  `\`${prefix}dev say <text>\` — speak as the bot here`,
                  '',
                  'You also **bypass every permission check** in every server.',
                ].join('\n')
              ),
          ],
        });

      case 'eval': {
        const code = args.slice(1).join(' ');
        if (!code) return message.reply({ embeds: [error('Provide code.')] });
        try {
          let result = eval(code); // eslint-disable-line no-eval
          if (result instanceof Promise) result = await result;
          let out = typeof result === 'string' ? result : inspect(result, { depth: 1 }).slice(0, 1900);
          // Redact the token if it ever appears.
          out = out.split(client.token).join('[TOKEN]');
          return message.channel.send({ embeds: [base(client.config.colors.success).setTitle('✅ Eval').setDescription(`\`\`\`js\n${out}\n\`\`\``)] });
        } catch (e) {
          return message.channel.send({ embeds: [base(client.config.colors.error).setTitle('❌ Eval Error').setDescription(`\`\`\`js\n${String(e).slice(0, 1900)}\n\`\`\``)] });
        }
      }

      case 'guilds':
      case 'servers': {
        const guilds = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
        const lines = guilds.slice(0, 30).map((g) => `\`${g.id}\` **${g.name}** — ${g.memberCount} members`);
        return message.channel.send({ embeds: [base().setTitle(`Servers (${client.guilds.cache.size})`).setDescription(lines.join('\n'))] });
      }

      case 'leaveguild': {
        const g = client.guilds.cache.get(args[1]);
        if (!g) return message.reply({ embeds: [error('Not in that guild.')] });
        const name = g.name;
        await g.leave().catch(() => {});
        return message.reply({ embeds: [success(message.author, `Left **${name}**.`)] });
      }

      case 'blacklist': {
        const id = args[1];
        if (!id) return message.reply({ embeds: [error('Provide a user ID.')] });
        const bl = db.getSettings('global', 'blacklist', { users: [] });
        if (!bl.users.includes(id)) bl.users.push(id);
        db.saveSettings('global', 'blacklist', bl);
        return message.reply({ embeds: [success(message.author, `Blacklisted \`${id}\`.`)] });
      }
      case 'unblacklist': {
        const id = args[1];
        const bl = db.getSettings('global', 'blacklist', { users: [] });
        bl.users = bl.users.filter((u) => u !== id);
        db.saveSettings('global', 'blacklist', bl);
        return message.reply({ embeds: [success(message.author, `Unblacklisted \`${id}\`.`)] });
      }
      case 'blacklisted': {
        const bl = db.getSettings('global', 'blacklist', { users: [] });
        return message.channel.send({ embeds: [base().setTitle('Blacklisted users').setDescription(bl.users.map((u) => `\`${u}\``).join('\n') || 'None.')] });
      }

      case 'reload': {
        const loadCommands = require('../../handlers/commandHandler');
        client.commands.clear();
        client.aliases.clear();
        const n = loadCommands(client);
        return message.reply({ embeds: [success(message.author, `Reloaded **${n}** commands.`)] });
      }

      case 'setstatus': {
        const text = args.slice(1).join(' ') || `${prefix}help`;
        client.user.setActivity(text);
        return message.reply({ embeds: [success(message.author, `Status set to **${text}**.`)] });
      }

      case 'say': {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply({ embeds: [error('Say what?')] });
        await message.delete().catch(() => {});
        return message.channel.send(text);
      }

      default:
        return message.reply({ embeds: [error(`Unknown dev subcommand. Try \`${prefix}dev help\`.`)] });
    }
  },
});
