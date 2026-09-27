const db = require('../database/db');

/**
 * Polls the timers table every 5s and fires due actions. Keeping this in one
 * place means tempban/mute/timeout/jail expiry, giveaway ends and reminders
 * all survive restarts (they're persisted, not setTimeout in memory).
 */
function startScheduler(client) {
  setInterval(async () => {
    const due = db.getDueTimers(Date.now());
    for (const t of due) {
      db.removeTimer(t.id);
      try {
        await handle(client, t);
      } catch (err) {
        client.logger.error(`Timer ${t.type} failed: ${err.message}`);
      }
    }
  }, 5000).unref();

  // Autopurge sweep every minute.
  setInterval(() => autopurgeSweep(client).catch(() => {}), 60_000).unref();

  // Counter channel refresh every 10 minutes (rename rate limits are strict).
  setInterval(() => counterSweep(client).catch(() => {}), 10 * 60_000).unref();

  client.logger.info('Scheduler started (5s tick, 60s autopurge, 10m counters).');
}

async function counterSweep(client) {
  const { applyTemplate } = require('../commands/engagement/counters');
  for (const guild of client.guilds.cache.values()) {
    const data = db.getSettings(guild.id, 'counters', { channels: {} });
    for (const [id, conf] of Object.entries(data.channels)) {
      const ch = guild.channels.cache.get(id);
      if (ch) await ch.setName(applyTemplate(conf.template, guild)).catch(() => {});
    }
  }
}

/** Purge channels that have an autopurge schedule due. */
async function autopurgeSweep(client) {
  for (const guild of client.guilds.cache.values()) {
    const data = db.getSettings(guild.id, 'autopurge', { channels: {} });
    let changed = false;
    for (const [chId, conf] of Object.entries(data.channels)) {
      if (Date.now() - (conf.last || 0) < conf.interval) continue;
      const ch = guild.channels.cache.get(chId);
      if (ch?.isTextBased()) {
        const msgs = await ch.messages.fetch({ limit: 100 }).catch(() => null);
        if (msgs?.size) {
          const fresh = msgs.filter((m) => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
          await ch.bulkDelete(fresh, true).catch(() => {});
        }
      }
      conf.last = Date.now();
      data.channels[chId] = conf;
      changed = true;
    }
    if (changed) db.saveSettings(guild.id, 'autopurge', data);
  }
}

async function handle(client, timer) {
  const data = safeJson(timer.data);
  const guild = client.guilds.cache.get(timer.guild_id);
  if (!guild) return;

  switch (timer.type) {
    case 'unban': {
      await guild.bans.remove(timer.target_id, 'Temp-ban expired').catch(() => {});
      break;
    }
    case 'untimeout': {
      const m = await guild.members.fetch(timer.target_id).catch(() => null);
      if (m) await m.timeout(null, 'Timeout expired').catch(() => {});
      break;
    }
    case 'unmute': {
      const settings = db.getSettings(guild.id, 'settings', {});
      const roleId = settings.muteRole;
      const m = await guild.members.fetch(timer.target_id).catch(() => null);
      if (m && roleId) await m.roles.remove(roleId, 'Mute expired').catch(() => {});
      break;
    }
    case 'unjail': {
      const m = await guild.members.fetch(timer.target_id).catch(() => null);
      if (m) await restoreFromJail(client, guild, m, data);
      break;
    }
    case 'temprole': {
      const m = await guild.members.fetch(timer.target_id).catch(() => null);
      if (m && data.roleId) await m.roles.remove(data.roleId, 'Temp-role expired').catch(() => {});
      break;
    }
    case 'reminder': {
      const user = await client.users.fetch(timer.target_id).catch(() => null);
      if (user) {
        user
          .send(`⏰ Reminder: ${data.message || '(no message)'}`)
          .catch(() => {
            const ch = guild.channels.cache.get(data.channelId);
            ch?.send(`⏰ <@${timer.target_id}> ${data.message || ''}`).catch(() => {});
          });
      }
      break;
    }
    case 'giveaway': {
      const mod = require('../commands/giveaway/giveaway');
      if (mod.endGiveaway) await mod.endGiveaway(client, guild, timer.target_id, data);
      break;
    }
    default:
      break;
  }
}

async function restoreFromJail(client, guild, member, data) {
  const roleIds = data.roles || [];
  const jailRole = db.getSettings(guild.id, 'settings', {}).jailRole;
  if (jailRole) await member.roles.remove(jailRole, 'Jail expired').catch(() => {});
  for (const r of roleIds) {
    if (guild.roles.cache.has(r)) await member.roles.add(r, 'Jail expired').catch(() => {});
  }
}

function safeJson(str) {
  try {
    return JSON.parse(str || '{}');
  } catch {
    return {};
  }
}

module.exports = { startScheduler };
