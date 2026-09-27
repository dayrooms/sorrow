const { inspect } = require('node:util');
const { exec } = require('node:child_process');
const Command = require('../../structures/Command');
const { LEVELS, isBotOwner } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const db = require('../../database/db');
const { paginate, chunk } = require('../../utils/paginate');

/**
 * Developer command suite — LOCKED to bot owner (OWNER_IDS).
 * permLevel BOT_OWNER means the dispatcher's check() already blocks everyone
 * else, but run() double-checks isBotOwner for safety.
 *
 * NOTE ON PROFILE: A Discord bot has ONE global avatar/banner/username shared
 * across every server. Those are owner-only here (dev setavatar/setbanner/
 * setusername). Per-SERVER appearance is limited by Discord to the bot's
 * nickname — that's what the `customize` command (admins) handles.
 */

// The full command catalogue — also drives `;dev help`.
const HELP = [
  ['General', [
    ['eval <code>', 'Run JavaScript (async supported). Token auto-redacted.'],
    ['exec <shell>', 'Run a shell command on the host.'],
    ['reload', 'Hot-reload all commands.'],
    ['restart', 'Restart the bot process (host must auto-restart it).'],
    ['shutdown', 'Stop the bot process.'],
    ['ping', 'Show WS + host latency.'],
    ['stats', 'Memory, uptime, guild/user/command counts.'],
  ]],
  ['Profile (global — affects every server)', [
    ['setavatar <url|attachment>', "Set the bot's global avatar."],
    ['setbanner <url|attachment>', "Set the bot's global banner."],
    ['setusername <name>', "Change the bot's username (rate-limited by Discord)."],
    ['presence <online|idle|dnd|invisible>', 'Set the status dot.'],
    ['activity <type> <text> [url]', 'playing/watching/listening/streaming/competing/custom.'],
  ]],
  ['Guilds', [
    ['guilds', 'List servers with member counts.'],
    ['guildinfo <id>', 'Detailed info about a guild.'],
    ['leaveguild <id>', 'Leave a server.'],
    ['getinvite <id>', 'Create an invite to a server the bot is in.'],
    ['nickname <guildId> <name>', "Set the bot's nickname in a server."],
  ]],
  ['Users & Access', [
    ['blacklist <userId>', 'Block a user from using the bot.'],
    ['unblacklist <userId>', 'Unblock a user.'],
    ['blacklisted', 'List blocked users.'],
    ['dm <userId> <message>', 'DM a user as the bot.'],
    ['su <userId>', 'Show who a user id resolves to.'],
  ]],
  ['Utility', [
    ['say <text>', 'Speak as the bot in this channel.'],
    ['echo <#channel> <text>', 'Send a message to a channel by id/mention.'],
    ['cleanup [amount]', "Delete the bot's own recent messages here."],
    ['throw', 'Throw a test error (checks error handling).'],
  ]],
];

module.exports = new Command({
  name: 'dev',
  aliases: ['developer', 'd'],
  category: 'developer',
  description: 'Developer/owner-only commands.',
  permLevel: LEVELS.BOT_OWNER,
  guildOnly: false,
  usage: 'help | eval | exec | setavatar | setbanner | presence | ...',
  async run({ client, message, args, prefix, sub }) {
    if (!isBotOwner(message.author.id)) return; // hard gate

    switch (sub) {
      case '':
      case 'help': {
        const pages = HELP.map(([section, cmds]) =>
          base(client.config.colors.accent)
            .setTitle('🛠️ Developer Commands')
            .setDescription(
              `**${section}**\n` +
                cmds.map(([u, d]) => `\`${prefix}dev ${u}\`\n${d}`).join('\n\n') +
                `\n\nYou also **bypass every permission check** in every server.`
            )
        );
        return paginate(message, pages, { userId: message.author.id });
      }

      // ── General ──────────────────────────────────────────
      case 'eval': {
        const code = args.slice(1).join(' ');
        if (!code) return message.reply({ embeds: [error('Provide code.')] });
        try {
          let result = eval(code); // eslint-disable-line no-eval
          if (result instanceof Promise) result = await result;
          let out = typeof result === 'string' ? result : inspect(result, { depth: 1 });
          out = out.split(client.token).join('[TOKEN]').slice(0, 1900);
          return message.channel.send({ embeds: [base(client.config.colors.success).setTitle('✅ Eval').setDescription(`\`\`\`js\n${out}\n\`\`\``)] });
        } catch (e) {
          return message.channel.send({ embeds: [base(client.config.colors.error).setTitle('❌ Eval Error').setDescription(`\`\`\`js\n${String(e).slice(0, 1900)}\n\`\`\``)] });
        }
      }

      case 'exec':
      case 'sh': {
        const cmd = args.slice(1).join(' ');
        if (!cmd) return message.reply({ embeds: [error('Provide a shell command.')] });
        exec(cmd, { timeout: 20000 }, (err, stdout, stderr) => {
          let out = (stdout || '') + (stderr || '') || (err ? String(err) : 'No output.');
          out = out.split(client.token).join('[TOKEN]').slice(0, 1900);
          message.channel.send({ embeds: [base(err ? client.config.colors.error : client.config.colors.success).setTitle(err ? '❌ Exec Error' : '✅ Exec').setDescription(`\`\`\`\n${out}\n\`\`\``)] }).catch(() => {});
        });
        return;
      }

      case 'reload': {
        const loadCommands = require('../../handlers/commandHandler');
        client.commands.clear();
        client.aliases.clear();
        const n = loadCommands(client);
        return message.reply({ embeds: [success(message.author, `Reloaded **${n}** commands.`)] });
      }

      case 'restart': {
        await message.reply({ embeds: [success(message.author, 'Restarting...')] });
        process.exit(0); // host/process manager restarts it
        return;
      }
      case 'shutdown': {
        await message.reply({ embeds: [success(message.author, 'Shutting down.')] });
        client.destroy();
        process.exit(0);
        return;
      }

      case 'ping': {
        const s = await message.channel.send('Pinging...');
        await s.edit(`🏓 WS **${Math.round(client.ws.ping)}ms** · Host **${s.createdTimestamp - message.createdTimestamp}ms**`);
        return;
      }

      case 'stats': {
        const mem = process.memoryUsage();
        const up = process.uptime();
        return message.channel.send({
          embeds: [base().setTitle('📊 Dev Stats').setDescription(
            [
              `**Guilds:** ${client.guilds.cache.size}`,
              `**Users (cached):** ${client.users.cache.size}`,
              `**Commands:** ${client.commands.size}`,
              `**RSS:** ${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
              `**Heap:** ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
              `**Uptime:** ${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m`,
              `**Node:** ${process.version}`,
            ].join('\n')
          )],
        });
      }

      // ── Profile (global) ─────────────────────────────────
      case 'setavatar':
      case 'setpfp': {
        const url = message.attachments.first()?.url || args[1];
        if (!url) return message.reply({ embeds: [error(`Usage: \`${prefix}dev setavatar <url or attachment>\``)] });
        try {
          await client.user.setAvatar(url);
          return message.reply({ embeds: [success(message.author, "Updated the bot's global avatar.")] });
        } catch (e) {
          return message.reply({ embeds: [error(`Failed: ${e.message} (avatar changes are rate-limited by Discord).`)] });
        }
      }
      case 'setbanner': {
        const url = message.attachments.first()?.url || args[1];
        if (!url) return message.reply({ embeds: [error(`Usage: \`${prefix}dev setbanner <url or attachment>\``)] });
        try {
          await client.user.setBanner(url);
          return message.reply({ embeds: [success(message.author, "Updated the bot's global banner.")] });
        } catch (e) {
          return message.reply({ embeds: [error(`Failed: ${e.message}`)] });
        }
      }
      case 'setusername':
      case 'setname': {
        const name = args.slice(1).join(' ');
        if (!name) return message.reply({ embeds: [error(`Usage: \`${prefix}dev setusername <name>\``)] });
        try {
          await client.user.setUsername(name);
          return message.reply({ embeds: [success(message.author, `Username changed to **${name}**.`)] });
        } catch (e) {
          return message.reply({ embeds: [error(`Failed: ${e.message} (usernames are rate-limited to ~2/hour).`)] });
        }
      }

      case 'setstatus':
      case 'activity': {
        const { ActivityType } = require('discord.js');
        const typeArg = (args[1] || 'playing').toLowerCase();
        const typeMap = {
          playing: ActivityType.Playing, watching: ActivityType.Watching,
          listening: ActivityType.Listening, streaming: ActivityType.Streaming,
          competing: ActivityType.Competing, custom: ActivityType.Custom,
        };
        if (!typeMap[typeArg]) return message.reply({ embeds: [error(`Usage: \`${prefix}dev activity <playing|watching|listening|streaming|competing|custom> <text> [url]\``)] });
        let rest = args.slice(2);
        let url;
        if (typeArg === 'streaming') {
          const maybe = rest[rest.length - 1];
          if (/^https?:\/\//.test(maybe || '')) { url = maybe; rest = rest.slice(0, -1); }
          else url = 'https://twitch.tv/discord';
        }
        const text = rest.join(' ') || `${prefix}help`;
        const activity = { name: text, type: typeMap[typeArg] };
        if (typeArg === 'streaming') activity.url = url;
        client.user.setActivity(activity);
        return message.reply({ embeds: [success(message.author, `Activity set: **${typeArg}** ${text}${url ? ` (${url})` : ''}.`)] });
      }

      case 'presence':
      case 'status': {
        const st = (args[1] || '').toLowerCase();
        if (!['online', 'idle', 'dnd', 'invisible'].includes(st)) return message.reply({ embeds: [error(`Usage: \`${prefix}dev presence <online|idle|dnd|invisible>\``)] });
        client.user.setStatus(st);
        return message.reply({ embeds: [success(message.author, `Presence set to **${st}**.`)] });
      }

      // ── Guilds ───────────────────────────────────────────
      case 'guilds':
      case 'servers': {
        const guilds = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
        const lines = guilds.map((g) => `\`${g.id}\` **${g.name}** — ${g.memberCount}`);
        const pages = chunk(lines, 15).map((c) => base().setTitle(`Servers (${client.guilds.cache.size})`).setDescription(c.join('\n')));
        return paginate(message, pages, { userId: message.author.id });
      }
      case 'guildinfo': {
        const g = client.guilds.cache.get(args[1]);
        if (!g) return message.reply({ embeds: [error('Not in that guild.')] });
        const owner = await g.fetchOwner().catch(() => null);
        return message.channel.send({ embeds: [base().setTitle(g.name).setThumbnail(g.iconURL()).setDescription(
          [`**ID:** ${g.id}`, `**Owner:** ${owner ? owner.user.tag : g.ownerId}`, `**Members:** ${g.memberCount}`, `**Created:** <t:${Math.floor(g.createdTimestamp / 1000)}:R>`, `**Channels:** ${g.channels.cache.size}`, `**Roles:** ${g.roles.cache.size}`].join('\n')
        )] });
      }
      case 'leaveguild': {
        const g = client.guilds.cache.get(args[1]);
        if (!g) return message.reply({ embeds: [error('Not in that guild.')] });
        const name = g.name;
        await g.leave().catch(() => {});
        return message.reply({ embeds: [success(message.author, `Left **${name}**.`)] });
      }
      case 'getinvite': {
        const g = client.guilds.cache.get(args[1]);
        if (!g) return message.reply({ embeds: [error('Not in that guild.')] });
        const channel = g.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(g.members.me).has('CreateInstantInvite'));
        if (!channel) return message.reply({ embeds: [error('No channel I can invite to.')] });
        const inv = await channel.createInvite({ maxAge: 300, maxUses: 1 }).catch(() => null);
        return message.reply({ embeds: [inv ? success(message.author, `Invite: ${inv.url}`) : error('Failed to create invite.')] });
      }
      case 'nickname': {
        const g = client.guilds.cache.get(args[1]);
        if (!g) return message.reply({ embeds: [error('Not in that guild.')] });
        const nick = args.slice(2).join(' ') || null;
        await g.members.me.setNickname(nick).catch(() => {});
        return message.reply({ embeds: [success(message.author, `Nickname in **${g.name}** set to **${nick || '(reset)'}**.`)] });
      }

      // ── Users & Access ───────────────────────────────────
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
      case 'dm': {
        const id = args[1];
        const text = args.slice(2).join(' ');
        if (!id || !text) return message.reply({ embeds: [error(`Usage: \`${prefix}dev dm <userId> <message>\``)] });
        const user = await client.users.fetch(id).catch(() => null);
        if (!user) return message.reply({ embeds: [error('User not found.')] });
        await user.send(text).catch(() => message.reply({ embeds: [error('Could not DM them.')] }));
        return message.reply({ embeds: [success(message.author, `Sent a DM to **${user.tag}**.`)] });
      }
      case 'su': {
        const user = await client.users.fetch(args[1]).catch(() => null);
        return message.reply({ embeds: [user ? base().setDescription(`\`${user.id}\` → **${user.tag}**`).setThumbnail(user.displayAvatarURL()) : error('User not found.')] });
      }

      // ── Utility ──────────────────────────────────────────
      case 'say': {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply({ embeds: [error('Say what?')] });
        await message.delete().catch(() => {});
        return message.channel.send(text);
      }
      case 'echo': {
        const ch = message.mentions.channels.first() || client.channels.cache.get(args[1]);
        const text = args.slice(2).join(' ');
        if (!ch?.isTextBased() || !text) return message.reply({ embeds: [error(`Usage: \`${prefix}dev echo <#channel> <text>\``)] });
        await ch.send(text).catch(() => {});
        return message.reply({ embeds: [success(message.author, `Sent to ${ch}.`)] });
      }
      case 'cleanup': {
        const amount = Math.min(parseInt(args[1], 10) || 50, 100);
        const msgs = await message.channel.messages.fetch({ limit: amount }).catch(() => null);
        if (msgs) {
          const mine = msgs.filter((m) => m.author.id === client.user.id);
          await message.channel.bulkDelete(mine, true).catch(() => {});
        }
        return message.reply({ embeds: [success(message.author, 'Cleaned up my recent messages.')] }).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
      }
      case 'throw':
        throw new Error('Test error thrown by dev throw.');

      default:
        return message.reply({ embeds: [error(`Unknown dev subcommand. Try \`${prefix}dev help\`.`)] });
    }
  },
});
