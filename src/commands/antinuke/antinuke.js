const { PermissionsBitField } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS, isBotOwner } = require('../../utils/permissions');
const { success, error, base, pickSubColor } = require('../../utils/embed');
const { resolveMember, resolveUser, resolveChannel } = require('../../utils/resolve');
const { paginate, chunk } = require('../../utils/paginate');
const an = require('../../utils/antinuke');
const restore = require('../../utils/restore');
const db = require('../../database/db');

// Human aliases -> canonical module keys (so `antinuke antichanneldelete on` works).
const MODULE_ALIASES = {
  antiguildupdate: 'guildUpdate',
  guildupdate: 'guildUpdate',
  antichannelcreate: 'channelCreate',
  channelcreate: 'channelCreate',
  antichanneldelete: 'channelDelete',
  channeldelete: 'channelDelete',
  antichannelupdate: 'channelUpdate',
  channelupdate: 'channelUpdate',
  antirolecreate: 'roleCreate',
  rolecreate: 'roleCreate',
  antiroledelete: 'roleDelete',
  roledelete: 'roleDelete',
  antiroleupdate: 'roleUpdate',
  roleupdate: 'roleUpdate',
  antirolemember: 'roleMember',
  rolemember: 'roleMember',
  antiban: 'ban',
  ban: 'ban',
  antikick: 'kick',
  kick: 'kick',
  antiprune: 'prune',
  prune: 'prune',
  antibotadd: 'botAdd',
  botadd: 'botAdd',
  antiwebhookcreate: 'webhookCreate',
  webhookcreate: 'webhookCreate',
  antiwebhookdelete: 'webhookDelete',
  webhookdelete: 'webhookDelete',
  antiwebhookupdate: 'webhookUpdate',
  webhookupdate: 'webhookUpdate',
  antiemoji: 'emoji',
  emoji: 'emoji',
  antivanity: 'vanity',
  vanity: 'vanity',
};

function ownerOrError(message) {
  if (message.author.id === message.guild.ownerId || isBotOwner(message.author.id)) return true;
  return false;
}

module.exports = new Command({
  name: 'antinuke',
  aliases: ['an'],
  category: 'antinuke',
  description: 'Protect your server with antinuke — detection, punishment, and restore.',
  permLevel: LEVELS.USER, // fine-grained checks happen inside per subcommand
  usage: '<subcommand>',
  help: {
    title: 'Server nuke protection',
    intro: 'Watches your staff via the audit log, punishes attackers, and restores what they destroy. Put Sorrow at the top of the role list; the server owner can never be punished.',
    subcommands: [
      { usage: 'setup', desc: 'Enable antinuke with safe defaults (channel/role delete, ban, kick, webhook, bot-add, vanity) and set the log channel here. Best first step.' },
      { usage: 'toggle', desc: 'Master on/off switch for the whole system.' },
      { usage: '<module> <on/off> [ban/kick/strip] [threshold]', desc: 'Configure a module. e.g. `antinuke channeldelete on ban 3`. Modules: guildupdate, channelcreate/delete/update, rolecreate/delete/update, rolemember, ban, kick, prune, botadd, webhookcreate/delete/update, emoji, vanity.' },
      { usage: 'perm <permission> <on/off> [strip/ban]', desc: 'Revert & punish dangerous permission grants. e.g. `antinuke perm administrator on ban`. Perms: administrator, manageguild, managechannels, manageroles, managewebhooks, manageexpressions, banmembers, kickmembers, moderatemembers, mentioneveryone.' },
      { usage: 'botadd', desc: 'Toggle blocking ALL new bot joins outright.' },
      { usage: 'logging #channel', desc: 'Set the channel where antinuke posts alerts.' },
      { usage: 'dmlogs', desc: 'Toggle DM alerts to the server owner.' },
      { usage: 'whitelist @user', desc: 'Toggle a user/bot as exempt (never triggers antinuke). Use for trusted bots & staff.' },
      { usage: 'unwhitelist @user', desc: 'Remove someone from the whitelist.' },
      { usage: 'admin @user', desc: 'Toggle an antinuke admin — can edit settings and is trusted. Owner only.' },
      { usage: 'unadmin @user', desc: 'Revoke antinuke admin.' },
      { usage: 'admins', desc: 'List all antinuke admins.' },
      { usage: 'settings', desc: 'Show all modules, punishments, thresholds, log channel, whitelist & admin counts.' },
      { usage: 'list', desc: 'Paginated list of every module plus the whitelist.' },
      { usage: 'restore', desc: 'Rebuild recently deleted channels & roles from snapshots. Antinuke admin only.' },
      { usage: 'reset', desc: 'Wipe all antinuke config to defaults. Owner only.' },
    ],
  },
  async run({ client, message, args, prefix }) {
    const sub = (args[0] || '').toLowerCase();
    const guildId = message.guild.id;
    const cfg = an.getConfig(guildId);

    // Most subcommands require server owner; a few allow antinuke admins.
    const isOwner = ownerOrError(message);
    const isAdmin = db.isAntinukeAdmin(guildId, message.author.id) || isOwner;

    // Module toggle: `antinuke <module> on|off [punishment] [threshold]`
    if (MODULE_ALIASES[sub]) {
      if (!isOwner) return message.reply({ embeds: [error('Only the **server owner** can configure modules.')] });
      const key = MODULE_ALIASES[sub];
      const state = (args[1] || '').toLowerCase();
      if (!['on', 'off', 'enable', 'disable'].includes(state)) {
        return message.reply({ embeds: [error(`Usage: \`${prefix}antinuke ${sub} <on/off> [ban/kick/strip] [threshold]\``)] });
      }
      cfg.modules[key] = cfg.modules[key] || { ...an.DEFAULT_MODULE };
      cfg.modules[key].on = state === 'on' || state === 'enable';
      const pun = (args[2] || '').toLowerCase();
      if (['ban', 'kick', 'strip'].includes(pun)) cfg.modules[key].punishment = pun;
      const th = parseInt(args[3], 10);
      if (!Number.isNaN(th) && th > 0) cfg.modules[key].threshold = th;
      an.saveConfig(guildId, cfg);
      return message.reply({
        embeds: [
          success(
            message.author,
            `**${an.MODULES[key].label}** protection is now **${cfg.modules[key].on ? 'enabled' : 'disabled'}** ` +
              `(punishment: **${cfg.modules[key].punishment}**, threshold: **${cfg.modules[key].threshold}**).`
          ).setColor(pickSubColor(sub)),
        ],
      });
    }

    switch (sub) {
      case '':
      case 'help':
        return sendHelp(message, prefix);

      case 'toggle': {
        if (!isOwner) return noOwner(message);
        cfg.enabled = !cfg.enabled;
        an.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `Antinuke is now **${cfg.enabled ? 'enabled' : 'disabled'}**.`)] });
      }

      case 'setup': {
        if (!isOwner) return noOwner(message);
        // Sensible defaults: enable the destructive-action modules + set log channel to current.
        cfg.enabled = true;
        for (const key of ['channelDelete', 'roleDelete', 'ban', 'kick', 'webhookCreate', 'botAdd', 'vanity']) {
          cfg.modules[key] = cfg.modules[key] || { ...an.DEFAULT_MODULE };
          cfg.modules[key].on = true;
        }
        cfg.logChannel = message.channel.id;
        an.saveConfig(guildId, cfg);
        return message.reply({
          embeds: [
            success(
              message.author,
              `Antinuke enabled with safe defaults. Log channel set to ${message.channel}. ` +
                `Fine-tune with \`${prefix}antinuke edit\` or \`${prefix}antinuke <module> on/off\`.`
            ),
          ],
        });
      }

      case 'edit':
      case 'permissions':
        return sendEditGuide(message, prefix, sub === 'permissions');

      case 'logging': {
        if (!isOwner) return noOwner(message);
        const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels.first();
        if (!ch) return message.reply({ embeds: [error(`Usage: \`${prefix}antinuke logging #channel\``)] });
        cfg.logChannel = ch.id;
        an.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `Antinuke log channel set to ${ch}.`)] });
      }

      case 'dmlogs': {
        if (!isAdmin) return noAdmin(message);
        cfg.dmLogs = !cfg.dmLogs;
        an.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `DM alerts are now **${cfg.dmLogs ? 'on' : 'off'}**.`)] });
      }

      case 'whitelist': {
        if (!isOwner) return noOwner(message);
        const target = (await resolveMember(message.guild, args[1])) || (await resolveUser(client, args[1])) || message.mentions.users.first();
        if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}antinuke whitelist @user\``)] });
        const id = target.id || target.user?.id;
        const isBot = target.bot ?? target.user?.bot ?? false;
        if (db.isWhitelisted(guildId, id, 'antinuke')) {
          db.removeWhitelist(guildId, id, 'antinuke');
          return message.reply({ embeds: [success(message.author, `<@${id}> is no longer whitelisted.`)] });
        }
        db.addWhitelist(guildId, id, isBot ? 'bot' : 'user', 'antinuke', message.author.id);
        return message.reply({ embeds: [success(message.author, `<@${id}> is now whitelisted and will not trigger **antinuke**.`)] });
      }

      case 'unwhitelist': {
        if (!isOwner) return noOwner(message);
        const target = (await resolveUser(client, args[1])) || message.mentions.users.first();
        const id = target?.id || args[1];
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}antinuke unwhitelist @user\``)] });
        db.removeWhitelist(guildId, id, 'antinuke');
        return message.reply({ embeds: [success(message.author, `<@${id}> is no longer whitelisted.`)] });
      }

      case 'admin': {
        if (!isOwner) return noOwner(message);
        const target = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}antinuke admin @user\``)] });
        if (db.isAntinukeAdmin(guildId, target.id)) {
          db.removeAntinukeAdmin(guildId, target.id);
          return message.reply({ embeds: [success(message.author, `<@${target.id}> is no longer an **antinuke admin** and can no longer edit **antinuke settings**.`)] });
        }
        db.addAntinukeAdmin(guildId, target.id, message.author.id);
        return message.reply({ embeds: [success(message.author, `<@${target.id}> is now an **antinuke admin** and can edit **antinuke settings**.`)] });
      }

      case 'unadmin': {
        if (!isOwner) return noOwner(message);
        const target = (await resolveUser(client, args[1])) || message.mentions.users.first();
        const id = target?.id || args[1];
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}antinuke unadmin @user\``)] });
        db.removeAntinukeAdmin(guildId, id);
        return message.reply({ embeds: [success(message.author, `<@${id}> is no longer an **antinuke admin**.`)] });
      }

      case 'settings':
      case 'config':
        return sendSettings(message, cfg);

      case 'list':
        return sendList(message, cfg);

      case 'admins':
        return sendAdmins(message);

      case 'reset': {
        if (!isOwner) return noOwner(message);
        db.clearSettings(guildId, 'antinuke');
        return message.reply({ embeds: [success(message.author, 'Antinuke has been **completely reset** to defaults.')] });
      }

      case 'restore': {
        if (!isAdmin) return noAdmin(message);
        const m = await message.reply({ embeds: [base().setDescription('⏳ Restoring deleted channels and roles...')] });
        const res = await restore.restoreAll(message.guild);
        return m.edit({ embeds: [success(message.author, `Restore complete — recreated **${res.channels}** channel(s) and **${res.roles}** role(s).`)] });
      }

      case 'botadd': {
        // toggle the hard "deny all bot joins" switch
        if (!isOwner) return noOwner(message);
        cfg.denyBotAdd = !cfg.denyBotAdd;
        an.saveConfig(guildId, cfg);
        return message.reply({ embeds: [success(message.author, `Deny all bot joins is now **${cfg.denyBotAdd ? 'on' : 'off'}**.`)] });
      }

      default:
        // Permission-watch module toggle: `antinuke perm <permName> on/off [strip/ban]`
        if (sub === 'perm' || sub === 'permission') {
          if (!isOwner) return noOwner(message);
          const permKey = (args[1] || '').toLowerCase().replace(/\s+/g, '');
          if (!an.WATCHED_PERMS[permKey]) {
            return message.reply({ embeds: [error(`Unknown permission. Options: ${Object.keys(an.WATCHED_PERMS).join(', ')}`)] });
          }
          const state = (args[2] || '').toLowerCase();
          cfg.permWatch[permKey] = cfg.permWatch[permKey] || { on: false, action: 'strip' };
          cfg.permWatch[permKey].on = state === 'on' || state === 'enable';
          const act = (args[3] || '').toLowerCase();
          if (['strip', 'ban'].includes(act)) cfg.permWatch[permKey].action = act;
          an.saveConfig(guildId, cfg);
          return message.reply({
            embeds: [success(message.author, `Permission watch for **${permKey}** is now **${cfg.permWatch[permKey].on ? 'on' : 'off'}** (action: **${cfg.permWatch[permKey].action}**).`)],
          });
        }
        return message.reply({ embeds: [error(`Unknown subcommand. Try \`${prefix}antinuke\` for the list.`)] });
    }
  },
});

function noOwner(message) {
  return message.reply({ embeds: [error('Only the **server owner** can use this.')] });
}
function noAdmin(message) {
  return message.reply({ embeds: [error('Only **antinuke admins** or the **server owner** can use this.')] });
}

function sendHelp(message, prefix) {
  const { renderCommandHelp } = require('../../utils/commandHelp');
  return renderCommandHelp(message, module.exports, prefix, '🛡️');
}

function sendEditGuide(message, prefix, permsMode) {
  const e = base().setTitle(permsMode ? 'Antinuke — Permission Protection' : 'Antinuke — Edit Modules');
  if (permsMode) {
    e.setDescription(
      `Toggle protection against dangerous permission grants:\n\`${prefix}antinuke perm <permission> <on/off> [strip/ban]\`\n\n` +
        Object.keys(an.WATCHED_PERMS).map((p) => `• \`${p}\``).join('\n')
    );
  } else {
    e.setDescription(
      `Configure any module:\n\`${prefix}antinuke <module> <on/off> [ban/kick/strip] [threshold]\`\n\n` +
        Object.entries(an.MODULES).map(([k, v]) => `• \`${k}\` — ${v.label}`).join('\n')
    );
  }
  return message.channel.send({ embeds: [e] });
}

function sendSettings(message, cfg) {
  const on = (b) => (b ? '🟢' : '🔴');
  const modLines = Object.entries(an.MODULES)
    .map(([k, v]) => {
      const m = cfg.modules[k] || an.DEFAULT_MODULE;
      return `${on(m.on)} **${v.label}** — ${m.punishment}, thr ${m.threshold}`;
    })
    .join('\n');
  const permLines = Object.keys(an.WATCHED_PERMS)
    .map((p) => {
      const w = cfg.permWatch?.[p] || { on: false, action: 'strip' };
      return `${on(w.on)} ${p} → ${w.action}`;
    })
    .join('\n');

  const e = base()
    .setTitle('Sorrow Antinuke Settings')
    .setDescription(`Antinuke is **${cfg.enabled ? 'enabled' : 'disabled'}** in this server.`)
    .addFields(
      { name: 'Modules', value: modLines || 'None', inline: true },
      { name: 'Permission Protection', value: permLines || 'None', inline: true },
      {
        name: 'General',
        value: [
          `Log Channel: ${cfg.logChannel ? `<#${cfg.logChannel}>` : 'none'}`,
          `DM Logs: ${cfg.dmLogs ? 'on' : 'off'}`,
          `Deny Bot Joins: ${cfg.denyBotAdd ? 'on' : 'off'}`,
          `Whitelisted: ${db.listWhitelist(message.guild.id).filter((w) => w.scope === 'antinuke' || w.scope === 'both').length}`,
          `Admins: ${db.listAntinukeAdmins(message.guild.id).length}`,
        ].join('\n'),
        inline: false,
      }
    );
  return message.channel.send({ embeds: [e] });
}

function sendList(message, cfg) {
  const rows = [];
  let i = 1;
  for (const [k, v] of Object.entries(an.MODULES)) {
    const m = cfg.modules[k] || an.DEFAULT_MODULE;
    rows.push(`\`${i++}\` **${v.label}** (do: ${m.punishment}, threshold: ${m.threshold}, cmd: ${m.on ? 'on' : 'off'})`);
  }
  for (const w of db.listWhitelist(message.guild.id)) {
    if (w.scope !== 'antinuke' && w.scope !== 'both') continue;
    rows.push(`\`${i++}\` <@${w.entity_id}> whitelisted (\`${w.entity_id}\`) [${(w.type || 'user').toUpperCase()}]`);
  }
  const pages = chunk(rows, 10).map((c) => base().setTitle('Antinuke modules & whitelist').setDescription(c.join('\n')));
  return paginate(message, pages, { userId: message.author.id });
}

function sendAdmins(message) {
  const admins = db.listAntinukeAdmins(message.guild.id);
  const e = base()
    .setTitle('Antinuke admins')
    .setDescription(admins.length ? admins.map((id, i) => `\`${i + 1}\` <@${id}>`).join('\n') : 'No antinuke admins set.');
  return message.channel.send({ embeds: [e] });
}
