const Command = require('../../structures/Command');
const { LEVELS, isBotOwner } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, resolveUser, resolveChannel, parseDuration, formatDuration } = require('../../utils/resolve');
const ar = require('../../utils/antiraid');
const db = require('../../database/db');

function isOwner(message) {
  return message.author.id === message.guild.ownerId || isBotOwner(message.author.id);
}
function isAdmin(message) {
  return isOwner(message) || db.isAntinukeAdmin(message.guild.id, message.author.id);
}

module.exports = new Command({
  name: 'antiraid',
  aliases: ['ar'],
  category: 'antiraid',
  description: 'Protect your server from raids: mass joins, new accounts, no-avatar accounts.',
  permLevel: LEVELS.USER,
  usage: '<subcommand>',
  help: {
    title: 'Raid & mass-join protection',
    intro: 'Watches your front door: mass joins, brand-new/young accounts, and default-avatar accounts. Run setup for safe defaults, then tune each module. During a live raid use lockdown, raid, or recentban.',
    subcommands: [
      { usage: 'setup', desc: 'Enable antiraid with safe defaults (mass-join + new-account filters on) and set the log channel here.' },
      { usage: 'toggle', desc: 'Master on/off switch for antiraid.' },
      { usage: 'massjoin <on/off> [threshold] [windowSeconds] [kick/ban/lockdown]', desc: 'Trip when too many members join too fast. e.g. `antiraid massjoin on 10 10 lockdown` = 10 joins in 10s triggers a lockdown.' },
      { usage: 'newaccounts <on/off> [minAge] [kick/ban]', desc: 'Punish accounts younger than a minimum age on join. e.g. `antiraid newaccounts on 7d kick`.' },
      { usage: 'noavatar <on/off> [kick/ban]', desc: 'Punish members joining with a default (no) avatar.' },
      { usage: 'lockdown <on/off>', desc: 'Manually lock or unlock every text channel (@everyone can\'t send).' },
      { usage: 'raid <duration> <kick/ban> [reason]', desc: 'Punish everyone who joined within a recent window. e.g. `antiraid raid 10m ban` bans all who joined in the last 10 minutes.' },
      { usage: 'recentban <amount> [reason]', desc: 'Ban the N most recent members to join.' },
      { usage: 'logging #channel', desc: 'Set the antiraid alert channel.' },
      { usage: 'whitelist @user', desc: 'Toggle a user as exempt from antiraid.' },
      { usage: 'unwhitelist @user', desc: 'Remove someone from the antiraid whitelist.' },
      { usage: 'admin @user', desc: 'Let a user manage antiraid settings. Owner only.' },
      { usage: 'unadmin @user', desc: 'Revoke antiraid admin.' },
      { usage: 'settings', desc: 'Show all antiraid modules, thresholds, lockdown state and whitelist count.' },
      { usage: 'reset', desc: 'Wipe antiraid config to defaults. Owner only.' },
    ],
  },
  async run({ client, message, args, prefix }) {
    const sub = (args[0] || '').toLowerCase();
    const guildId = message.guild.id;
    const cfg = ar.getConfig(guildId);

    switch (sub) {
      case '':
      case 'help': {
        const { renderCommandHelp } = require('../../utils/commandHelp');
        return renderCommandHelp(message, module.exports, prefix, '🚨');
      }

      case 'toggle': {
        if (!isOwner(message)) return owner(message);
        cfg.enabled = !cfg.enabled;
        ar.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `Antiraid is now **${cfg.enabled ? 'enabled' : 'disabled'}**.`)] });
      }

      case 'setup': {
        if (!isOwner(message)) return owner(message);
        cfg.enabled = true;
        cfg.massjoin.on = true;
        cfg.newaccounts.on = true;
        cfg.noavatar.on = false;
        cfg.logChannel = message.channel.id;
        ar.saveConfig(guildId, cfg);
        return message.reply({
          embeds: [success(message.author, `Antiraid enabled with safe defaults. Log channel set to ${message.channel}. Tune with \`${prefix}antiraid edit\`.`)],
        });
      }

      case 'edit':
        return message.channel.send({
          embeds: [
            base().setTitle('Antiraid — Edit').setDescription(
              [
                `\`${prefix}antiraid massjoin <on/off> [threshold] [windowSeconds] [kick/ban/lockdown]\``,
                `\`${prefix}antiraid newaccounts <on/off> [minAge e.g. 7d] [kick/ban]\``,
                `\`${prefix}antiraid noavatar <on/off> [kick/ban]\``,
              ].join('\n')
            ),
          ],
        });

      case 'massjoin': {
        if (!isOwner(message)) return owner(message);
        const state = (args[1] || '').toLowerCase();
        if (!['on', 'off'].includes(state)) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid massjoin <on/off> [threshold] [windowSeconds] [kick/ban/lockdown]\``)] });
        cfg.massjoin.on = state === 'on';
        const th = parseInt(args[2], 10);
        if (!Number.isNaN(th) && th > 0) cfg.massjoin.threshold = th;
        const win = parseInt(args[3], 10);
        if (!Number.isNaN(win) && win > 0) cfg.massjoin.windowMs = win * 1000;
        const act = (args[4] || '').toLowerCase();
        if (['kick', 'ban', 'lockdown'].includes(act)) cfg.massjoin.action = act;
        ar.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `Mass-join: **${cfg.massjoin.on ? 'on' : 'off'}** — ${cfg.massjoin.threshold} joins / ${cfg.massjoin.windowMs / 1000}s → **${cfg.massjoin.action}**.`)] });
      }

      case 'newaccounts':
      case 'youngaccounts': {
        if (!isOwner(message)) return owner(message);
        const state = (args[1] || '').toLowerCase();
        if (!['on', 'off'].includes(state)) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid newaccounts <on/off> [minAge] [kick/ban]\``)] });
        cfg.newaccounts.on = state === 'on';
        const age = parseDuration(args[2]);
        if (age) cfg.newaccounts.minAgeMs = age;
        const act = (args[3] || '').toLowerCase();
        if (['kick', 'ban'].includes(act)) cfg.newaccounts.action = act;
        ar.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `New-account filter: **${cfg.newaccounts.on ? 'on' : 'off'}** — min age **${formatDuration(cfg.newaccounts.minAgeMs)}** → **${cfg.newaccounts.action}**.`)] });
      }

      case 'noavatar': {
        if (!isOwner(message)) return owner(message);
        const state = (args[1] || '').toLowerCase();
        if (!['on', 'off'].includes(state)) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid noavatar <on/off> [kick/ban]\``)] });
        cfg.noavatar.on = state === 'on';
        const act = (args[2] || '').toLowerCase();
        if (['kick', 'ban'].includes(act)) cfg.noavatar.action = act;
        ar.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `No-avatar filter: **${cfg.noavatar.on ? 'on' : 'off'}** → **${cfg.noavatar.action}**.`)] });
      }

      case 'lockdown': {
        if (!isOwner(message)) return owner(message);
        const state = (args[1] || '').toLowerCase();
        const on = state === 'on';
        if (!['on', 'off'].includes(state)) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid lockdown <on/off>\``)] });
        const m = await message.reply({ embeds: [base().setDescription(`⏳ ${on ? 'Locking' : 'Unlocking'} all channels...`)] });
        const changed = await ar.setLockdown(message.guild, on, `Antiraid lockdown by ${message.author.tag}`);
        cfg.lockdown.active = on;
        ar.saveConfig(guildId, cfg);
        return m.edit({ embeds: [success(message.author, `Lockdown **${on ? 'enabled' : 'disabled'}** — updated **${changed}** channels.`)] });
      }

      case 'raid': {
        if (!isOwner(message)) return owner(message);
        const dur = parseDuration(args[1]);
        const action = (args[2] || 'ban').toLowerCase();
        const reason = args.slice(3).join(' ') || 'Antiraid: raid cleanup';
        if (!dur) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid raid <duration> <kick/ban> [reason]\``)] });
        const cutoff = Date.now() - dur;
        const m = await message.reply({ embeds: [base().setDescription('⏳ Scanning recent joins...')] });
        await message.guild.members.fetch().catch(() => {});
        const targets = message.guild.members.cache.filter(
          (mem) => mem.joinedTimestamp && mem.joinedTimestamp >= cutoff && !ar.isExempt(message.guild, mem, client) && !mem.user.bot
        );
        let done = 0;
        for (const mem of targets.values()) {
          await ar.actOn(mem, action === 'kick' ? 'kick' : 'ban', reason);
          done++;
        }
        return m.edit({ embeds: [success(message.author, `Raid cleanup complete — **${action}ed ${done}** member(s) who joined in the last **${formatDuration(dur)}**.`)] });
      }

      case 'recentban': {
        if (!isOwner(message)) return owner(message);
        const amount = parseInt(args[1], 10);
        const reason = args.slice(2).join(' ') || 'Antiraid: recent ban';
        if (Number.isNaN(amount) || amount < 1) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid recentban <amount> [reason]\``)] });
        const m = await message.reply({ embeds: [base().setDescription('⏳ Banning most recent members...')] });
        await message.guild.members.fetch().catch(() => {});
        const recent = [...message.guild.members.cache.values()]
          .filter((mem) => !mem.user.bot && !ar.isExempt(message.guild, mem, client))
          .sort((a, b) => (b.joinedTimestamp || 0) - (a.joinedTimestamp || 0))
          .slice(0, amount);
        let done = 0;
        for (const mem of recent) {
          await ar.actOn(mem, 'ban', reason);
          done++;
        }
        return m.edit({ embeds: [success(message.author, `Banned the **${done}** most recent member(s).`)] });
      }

      case 'logging': {
        if (!isOwner(message)) return owner(message);
        const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels.first();
        if (!ch) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid logging #channel\``)] });
        cfg.logChannel = ch.id;
        ar.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `Antiraid log channel set to ${ch}.`)] });
      }

      case 'whitelist': {
        if (!isOwner(message)) return owner(message);
        const target = (await resolveUser(client, args[1])) || message.mentions.users.first();
        const id = target?.id || args[1];
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid whitelist @user\``)] });
        if (db.isWhitelisted(guildId, id, 'antiraid')) {
          db.removeWhitelist(guildId, id, 'antiraid');
          return message.reply({ embeds: [success(message.author, `<@${id}> is no longer antiraid-whitelisted.`)] });
        }
        db.addWhitelist(guildId, id, 'user', 'antiraid', message.author.id);
        return message.reply({ embeds: [success(message.author, `<@${id}> is now whitelisted from **antiraid**.`)] });
      }

      case 'unwhitelist': {
        if (!isOwner(message)) return owner(message);
        const target = (await resolveUser(client, args[1])) || message.mentions.users.first();
        const id = target?.id || args[1];
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid unwhitelist @user\``)] });
        db.removeWhitelist(guildId, id, 'antiraid');
        return message.reply({ embeds: [success(message.author, `<@${id}> is no longer antiraid-whitelisted.`)] });
      }

      case 'admin': {
        if (!isOwner(message)) return owner(message);
        const target = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid admin @user\``)] });
        db.addAntinukeAdmin(guildId, target.id, message.author.id); // shared admin table
        return message.reply({ embeds: [success(message.author, `<@${target.id}> can now manage **antiraid settings**.`)] });
      }

      case 'unadmin': {
        if (!isOwner(message)) return owner(message);
        const target = (await resolveUser(client, args[1])) || message.mentions.users.first();
        const id = target?.id || args[1];
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}antiraid unadmin @user\``)] });
        db.removeAntinukeAdmin(guildId, id);
        return message.reply({ embeds: [success(message.author, `<@${id}> can no longer manage antiraid settings.`)] });
      }

      case 'settings':
      case 'config': {
        const on = (b) => (b ? '🟢' : '🔴');
        const e = base()
          .setTitle('Sorrow Antiraid Settings')
          .setDescription(`Antiraid is **${cfg.enabled ? 'enabled' : 'disabled'}**.`)
          .addFields(
            { name: 'Mass Join', value: `${on(cfg.massjoin.on)} ${cfg.massjoin.threshold}/${cfg.massjoin.windowMs / 1000}s → ${cfg.massjoin.action}`, inline: false },
            { name: 'New Accounts', value: `${on(cfg.newaccounts.on)} min age ${formatDuration(cfg.newaccounts.minAgeMs)} → ${cfg.newaccounts.action}`, inline: false },
            { name: 'No Avatar', value: `${on(cfg.noavatar.on)} → ${cfg.noavatar.action}`, inline: false },
            { name: 'Lockdown', value: cfg.lockdown.active ? '🔒 active' : 'inactive', inline: true },
            { name: 'Log Channel', value: cfg.logChannel ? `<#${cfg.logChannel}>` : 'none', inline: true },
            { name: 'Whitelisted', value: String(db.listWhitelist(guildId).filter((w) => w.scope === 'antiraid' || w.scope === 'both').length), inline: true }
          );
        return message.channel.send({ embeds: [e] });
      }

      case 'reset': {
        if (!isOwner(message)) return owner(message);
        db.clearSettings(guildId, 'antiraid');
        return message.reply({ embeds: [success(message.author, 'Antiraid configuration has been **reset**.')] });
      }

      default:
        return message.reply({ embeds: [error(`Unknown subcommand. Try \`${prefix}antiraid\`.`)] });
    }
  },
});

function owner(message) {
  return message.reply({ embeds: [error('Only the **server owner** can use this.')] });
}
