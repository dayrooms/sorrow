const db = require('../database/db');
const { check, isBotOwner } = require('../utils/permissions');
const { error } = require('../utils/embed');

/**
 * The command dispatcher. Runs on every message:
 *  1. Ignore bots/DMs (guildOnly commands need a guild).
 *  2. Handle AFK return + AFK mentions.
 *  3. Match the guild prefix (or a mention of the bot).
 *  4. Resolve command / alias / user-defined alias.
 *  5. Respect ignore / suppress / restrict lists (bot owner bypasses).
 *  6. Permission + cooldown checks.
 *  7. Run, catching all errors.
 */
module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.guild) return;
    if (!message.channel.permissionsFor?.(message.guild.members.me)?.has('SendMessages')) {
      // Still allow AFK bookkeeping below even if we can't reply.
    }

    const guildId = message.guild.id;

    // ── AFK: clear on return, notify on mention ──────────────
    try {
      const selfAfk = db.getAfk(guildId, message.author.id);
      if (selfAfk) {
        db.removeAfk(guildId, message.author.id);
        // How many people mentioned them while away?
        const pending = db.getSettings(guildId, `afkmentions:${message.author.id}`, { list: [] });
        const count = pending.list?.length || 0;
        message.reply({
          embeds: [
            require('../utils/embed').success(
              message.author,
              `welcome back — removed your AFK.${count ? ` You were mentioned **${count}** time(s) — use \`${client.prefixFor(guildId)}afkmentions\` to see them.` : ''}`
            ),
          ],
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
      }
      if (message.mentions.users.size) {
        for (const [, u] of message.mentions.users) {
          if (u.id === message.author.id) continue;
          const a = db.getAfk(guildId, u.id);
          if (a) {
            message.channel
              .send({
                embeds: [
                  require('../utils/embed').embed(
                    `**${u.username}** is AFK: ${a.reason || 'AFK'} — <t:${a.since}:R>`
                  ),
                ],
              })
              .catch(() => {});
            // Record the mention for their afkmentions list (keep last 25).
            const store = db.getSettings(guildId, `afkmentions:${u.id}`, { list: [] });
            store.list = store.list || [];
            store.list.push({
              by: message.author.id,
              tag: message.author.tag,
              channel: message.channel.id,
              url: message.url,
              content: message.content.slice(0, 200),
              at: Math.floor(Date.now() / 1000),
            });
            if (store.list.length > 25) store.list = store.list.slice(-25);
            db.saveSettings(guildId, `afkmentions:${u.id}`, store);
          }
        }
      }
    } catch {}

    // ── Prefix resolution (custom prefix OR bot mention) ─────
    const prefix = client.prefixFor(guildId);
    const mentionRe = new RegExp(`^<@!?${client.user.id}>\\s*`);
    let used = null;
    if (message.content.startsWith(prefix)) used = prefix;
    else if (mentionRe.test(message.content)) used = message.content.match(mentionRe)[0];
    if (!used) return;

    const withoutPrefix = message.content.slice(used.length).trim();
    if (!withoutPrefix) {
      // Just the prefix / a bare mention → tiny hint.
      if (mentionRe.test(message.content)) {
        message.reply({
          embeds: [require('../utils/embed').embed(`My prefix here is \`${prefix}\`. Try \`${prefix}help\`.`)],
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
      }
      return;
    }

    const rawArgs = withoutPrefix.split(/\s+/);
    let cmdName = rawArgs.shift().toLowerCase();

    // ── User-defined aliases (per guild) ─────────────────────
    const guildAliases = db.getSettings(guildId, 'aliases', {});
    if (guildAliases[cmdName]) {
      // Expand: alias may include preset args.
      const expanded = String(guildAliases[cmdName]).split(/\s+/);
      cmdName = expanded.shift().toLowerCase();
      rawArgs.unshift(...expanded);
    }

    // Resolve to a real command (built-in name or alias).
    const resolvedName = client.commands.has(cmdName)
      ? cmdName
      : client.aliases.get(cmdName);
    const command = resolvedName ? client.commands.get(resolvedName) : null;
    if (!command) return;

    const owner = isBotOwner(message.author.id);

    // ── Global blacklist (owner-set) ─────────────────────────
    if (!owner) {
      const bl = db.getSettings('global', 'blacklist', { users: [] });
      if (bl.users?.includes(message.author.id)) return;
    }

    // ── ignore / suppress / restrict (owner bypasses all) ────
    if (!owner) {
      const ignore = db.getSettings(guildId, 'ignore', { users: [], roles: [], channels: [] });
      if (ignore.users?.includes(message.author.id)) return;
      if (ignore.channels?.includes(message.channel.id)) return;
      if (ignore.roles?.some((r) => message.member.roles.cache.has(r))) return;

      const suppress = db.getSettings(guildId, 'suppress', {}); // {cmd: [channelIds|'all']}
      const sChans = suppress[command.name];
      if (sChans && (sChans.includes('all') || sChans.includes(message.channel.id))) return;

      const restrict = db.getSettings(guildId, 'restrict', {}); // {cmd: [roleIds]}
      const rRoles = restrict[command.name];
      if (rRoles && rRoles.length && !rRoles.some((r) => message.member.roles.cache.has(r))) {
        return message.reply({
          embeds: [error('That command is restricted to specific roles here.')],
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
      }

      const disabled = db.getSettings(guildId, 'disabled', { commands: [] });
      if (disabled.commands?.includes(command.name)) return;
    }

    // ── Permission check ─────────────────────────────────────
    const permRes = check(message.member, command.permLevel, guildId);
    if (!permRes.ok) {
      return message.reply({
        embeds: [error(permRes.reason)],
        allowedMentions: { repliedUser: false },
      }).catch(() => {});
    }

    // ── Bot permission check ─────────────────────────────────
    if (command.botPerms.length) {
      const me = message.guild.members.me;
      const missing = command.botPerms.filter((p) => !me.permissions.has(p));
      if (missing.length) {
        return message.reply({
          embeds: [error(`I'm missing permission(s): **${missing.join(', ')}**.`)],
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
      }
    }

    // ── Cooldown ─────────────────────────────────────────────
    if (command.cooldown && !owner) {
      const key = `${command.name}:${message.author.id}`;
      const now = Date.now();
      const last = client.cooldowns.get(key) || 0;
      if (now - last < command.cooldown) {
        const left = ((command.cooldown - (now - last)) / 1000).toFixed(1);
        return message.reply({
          embeds: [error(`Slow down — try again in **${left}s**.`)],
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
      }
      client.cooldowns.set(key, now);
    }

    // ── Dispatch ─────────────────────────────────────────────
    const sub = rawArgs[0]?.toLowerCase() || null;
    try {
      await command.run({ client, message, args: rawArgs, prefix, sub, resolvedName: cmdName });
    } catch (err) {
      client.logger.error(`Command "${command.name}" threw: ${err.stack}`);
      message.reply({
        embeds: [error('Something went wrong running that command.')],
        allowedMentions: { repliedUser: false },
      }).catch(() => {});
    }
  },
};
