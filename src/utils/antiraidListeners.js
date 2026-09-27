const ar = require('./antiraid');

/**
 * Antiraid gateway listeners: primarily guildMemberAdd. Records join times for
 * mass-join detection and screens each joiner for new/young/no-avatar rules.
 */
function initAntiraid(client) {
  client.on('guildMemberAdd', async (member) => {
    if (member.user.bot) return; // bots handled by antinuke botAdd
    const guild = member.guild;
    const cfg = ar.getConfig(guild.id);
    if (!cfg.enabled) return;
    if (ar.isExempt(guild, member, client)) return;

    const now = Date.now();

    // ── Mass join detection ──────────────────────────────────
    if (cfg.massjoin?.on) {
      if (!client.antiraidJoinBucket.has(guild.id)) client.antiraidJoinBucket.set(guild.id, []);
      const arr = client.antiraidJoinBucket.get(guild.id);
      arr.push(now);
      // prune old
      const cutoff = now - cfg.massjoin.windowMs;
      while (arr.length && arr[0] < cutoff) arr.shift();

      if (arr.length >= cfg.massjoin.threshold) {
        // Raid in progress.
        if (cfg.massjoin.action === 'lockdown') {
          if (!cfg.lockdown.active) {
            const changed = await ar.setLockdown(guild, true, 'Antiraid: mass-join lockdown');
            cfg.lockdown.active = true;
            ar.saveConfig(guild.id, cfg);
            await ar.log(client, guild, cfg, {
              title: 'Mass Join — Lockdown',
              description: `Detected **${arr.length}** joins within the window. Locked **${changed}** channels.`,
            });
          }
        } else {
          await ar.actOn(member, cfg.massjoin.action, 'Antiraid: mass join');
          await ar.log(client, guild, cfg, {
            title: 'Mass Join',
            description: `<@${member.id}> ${cfg.massjoin.action}ed — **${arr.length}** joins in window.`,
          });
        }
        return;
      }
    }

    // ── New / young account ──────────────────────────────────
    if (cfg.newaccounts?.on) {
      const age = now - member.user.createdTimestamp;
      if (age < cfg.newaccounts.minAgeMs) {
        await ar.actOn(member, cfg.newaccounts.action, 'Antiraid: account too young');
        await ar.log(client, guild, cfg, {
          title: 'Young Account',
          description: `<@${member.id}> ${cfg.newaccounts.action}ed — account age below minimum (created <t:${Math.floor(
            member.user.createdTimestamp / 1000
          )}:R>).`,
        });
        return;
      }
    }

    // ── No avatar ────────────────────────────────────────────
    if (cfg.noavatar?.on && !member.user.avatar) {
      await ar.actOn(member, cfg.noavatar.action, 'Antiraid: no avatar');
      await ar.log(client, guild, cfg, {
        title: 'Default Avatar',
        description: `<@${member.id}> ${cfg.noavatar.action}ed — no custom avatar.`,
      });
    }
  });

  client.logger.info('Antiraid listeners attached.');
}

module.exports = { initAntiraid };
