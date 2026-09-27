const { AuditLogEvent, PermissionsBitField } = require('discord.js');
const an = require('./antinuke');
const restore = require('./restore');
const config = require('../config');

/**
 * Wires all antinuke gateway listeners onto the client. Called once from ready.
 * Kept separate from the command-event loader because antinuke needs many
 * gateway events bound with shared state.
 */
function initAntinuke(client) {
  const handle = async (guild, moduleKey, opts = {}) => {
    if (!guild) return;
    const cfg = an.getConfig(guild.id);
    if (!cfg.enabled) return;
    const mod = cfg.modules[moduleKey];
    if (!mod || !mod.on) return;

    const { executorId, entry } = await an.findActor(guild, opts.auditType, opts.targetId);
    if (!executorId) return;
    if (an.isExempt(guild, executorId, client)) return;

    const tripped = an.bump(client, guild.id, executorId, moduleKey, mod.threshold);

    // Always attempt restore for destructive modules, even before threshold,
    // so a single deletion is undone immediately.
    if (opts.restore) await opts.restore().catch(() => {});

    if (!tripped) return;

    const result = await an.punish(
      client,
      guild,
      executorId,
      mod.punishment,
      `Antinuke: ${an.MODULES[moduleKey]?.label || moduleKey} threshold exceeded`
    );
    an.clearBuckets(client, guild.id, executorId);

    await an.log(client, guild, cfg, {
      title: an.MODULES[moduleKey]?.label || moduleKey,
      description: `<@${executorId}> (\`${executorId}\`) triggered **${
        an.MODULES[moduleKey]?.label || moduleKey
      }** protection.\n**Punishment:** ${result}`,
    });
  };

  // ── Channels ───────────────────────────────────────────────
  client.on('channelCreate', (channel) => {
    if (!channel.guild) return;
    restore.saveChannel(channel.guild.id, channel);
    handle(channel.guild, 'channelCreate', { auditType: AuditLogEvent.ChannelCreate, targetId: channel.id });
  });

  client.on('channelDelete', (channel) => {
    if (!channel.guild) return;
    handle(channel.guild, 'channelDelete', {
      auditType: AuditLogEvent.ChannelDelete,
      targetId: channel.id,
      restore: async () => {
        const cfg = an.getConfig(channel.guild.id);
        if (cfg.modules.channelDelete?.on) await restore.restoreChannel(channel.guild, channel.id);
      },
    });
  });

  client.on('channelUpdate', (oldC, newC) => {
    if (!newC.guild) return;
    restore.saveChannel(newC.guild.id, newC);
    handle(newC.guild, 'channelUpdate', { auditType: AuditLogEvent.ChannelUpdate, targetId: newC.id });
  });

  // ── Roles ──────────────────────────────────────────────────
  client.on('roleCreate', (role) => {
    restore.saveRole(role.guild.id, role);
    handle(role.guild, 'roleCreate', { auditType: AuditLogEvent.RoleCreate, targetId: role.id });
  });

  client.on('roleDelete', (role) => {
    handle(role.guild, 'roleDelete', {
      auditType: AuditLogEvent.RoleDelete,
      targetId: role.id,
      restore: async () => {
        const cfg = an.getConfig(role.guild.id);
        if (cfg.modules.roleDelete?.on) await restore.restoreRole(role.guild, role.id);
      },
    });
  });

  client.on('roleUpdate', (oldR, newR) => {
    restore.saveRole(newR.guild.id, newR);
    // Permission-grant watcher: did this update ADD a dangerous permission?
    checkPermGrant(client, oldR, newR);
    handle(newR.guild, 'roleUpdate', { auditType: AuditLogEvent.RoleUpdate, targetId: newR.id });
  });

  // ── Members: ban / kick / role-give ────────────────────────
  client.on('guildBanAdd', (ban) => {
    handle(ban.guild, 'ban', { auditType: AuditLogEvent.MemberBanAdd, targetId: ban.user.id });
  });

  client.on('guildMemberRemove', async (member) => {
    // Distinguish kick from voluntary leave via audit log timing.
    const { executorId } = await an.findActor(member.guild, AuditLogEvent.MemberKick, member.id, 5000);
    if (executorId) handle(member.guild, 'kick', { auditType: AuditLogEvent.MemberKick, targetId: member.id });
  });

  client.on('guildMemberUpdate', (oldM, newM) => {
    // Mass role-give protection + permission grant via role assignment.
    if (oldM.roles.cache.size !== newM.roles.cache.size) {
      handle(newM.guild, 'roleMember', { auditType: AuditLogEvent.MemberRoleUpdate, targetId: newM.id });
      checkDangerousRoleGain(client, oldM, newM);
    }
  });

  // ── Bots ───────────────────────────────────────────────────
  client.on('guildMemberAdd', async (member) => {
    if (!member.user.bot) return;
    const cfg = an.getConfig(member.guild.id);
    if (!cfg.enabled) return;

    // Hard "deny all bot adds" switch.
    if (cfg.denyBotAdd) {
      const { executorId } = await an.findActor(member.guild, AuditLogEvent.BotAdd, member.id, 8000);
      if (executorId && !an.isExempt(member.guild, executorId, client)) {
        await member.kick('Antinuke: bot adds are disabled').catch(() => {});
        await an.log(client, member.guild, cfg, {
          title: 'Bot Add Blocked',
          description: `Kicked bot <@${member.id}> added by <@${executorId}> (bot adds disabled).`,
        });
        return;
      }
    }

    if (cfg.modules.botAdd?.on) {
      handle(member.guild, 'botAdd', { auditType: AuditLogEvent.BotAdd, targetId: member.id });
    }
  });

  // ── Webhooks ───────────────────────────────────────────────
  client.on('webhooksUpdate', async (channel) => {
    // We can't tell create vs delete from this event alone; use audit log.
    const guild = channel.guild;
    const cfg = an.getConfig(guild.id);
    if (!cfg.enabled) return;
    for (const [key, auditType] of [
      ['webhookCreate', AuditLogEvent.WebhookCreate],
      ['webhookDelete', AuditLogEvent.WebhookDelete],
      ['webhookUpdate', AuditLogEvent.WebhookUpdate],
    ]) {
      if (cfg.modules[key]?.on) handle(guild, key, { auditType });
    }
  });

  // ── Emoji / Sticker delete ─────────────────────────────────
  client.on('emojiDelete', (emoji) => {
    handle(emoji.guild, 'emoji', { auditType: AuditLogEvent.EmojiDelete, targetId: emoji.id });
  });
  client.on('stickerDelete', (sticker) => {
    handle(sticker.guild, 'emoji', { auditType: AuditLogEvent.StickerDelete, targetId: sticker.id });
  });

  // ── Guild update (name/icon) + Vanity change ───────────────
  client.on('guildUpdate', async (oldG, newG) => {
    const cfg = an.getConfig(newG.id);
    if (!cfg.enabled) return;

    // Vanity URL protection: if vanity changed, restore it.
    if (cfg.modules.vanity?.on && oldG.vanityURLCode && oldG.vanityURLCode !== newG.vanityURLCode) {
      const { executorId } = await an.findActor(newG, AuditLogEvent.GuildUpdate, null, 10000);
      if (executorId && !an.isExempt(newG, executorId, client)) {
        // Try to restore the old vanity (needs the guild to still be eligible).
        await newG.setVanityCode?.(oldG.vanityURLCode, 'Antinuke: vanity restore').catch(() => {});
        const result = await an.punish(client, newG, executorId, cfg.modules.vanity.punishment, 'Antinuke: vanity change');
        an.clearBuckets(client, newG.id, executorId);
        await an.log(client, newG, cfg, {
          title: 'Vanity Protection',
          description: `<@${executorId}> changed the vanity from \`${oldG.vanityURLCode}\` to \`${newG.vanityURLCode}\`. Restored.\n**Punishment:** ${result}`,
        });
      }
    }

    if (cfg.modules.guildUpdate?.on) {
      handle(newG, 'guildUpdate', { auditType: AuditLogEvent.GuildUpdate });
    }
  });

  client.logger.info('Antinuke listeners attached.');
}

/** Detect a role UPDATE that newly grants a watched permission. */
async function checkPermGrant(client, oldR, newR) {
  const guild = newR.guild;
  const cfg = an.getConfig(guild.id);
  if (!cfg.enabled) return;

  for (const [permKey, flag] of Object.entries(an.WATCHED_PERMS)) {
    const watch = cfg.permWatch?.[permKey];
    if (!watch?.on) continue;
    const had = oldR.permissions.has(flag);
    const has = newR.permissions.has(flag);
    if (!had && has) {
      // Someone granted this dangerous permission to a role.
      const { executorId } = await an.findActor(guild, AuditLogEvent.RoleUpdate, newR.id, 10000);
      if (!executorId || an.isExempt(guild, executorId, client)) return;

      // Revert the grant.
      await newR.setPermissions(oldR.permissions, 'Antinuke: reverted dangerous permission grant').catch(() => {});

      const result =
        watch.action === 'ban'
          ? await an.punish(client, guild, executorId, 'ban', `Antinuke: granted ${permKey}`)
          : await an.punish(client, guild, executorId, 'strip', `Antinuke: granted ${permKey}`);

      await an.log(client, guild, cfg, {
        title: 'Permission Grant Blocked',
        description: `<@${executorId}> granted **${permKey}** to role **${newR.name}**. Reverted.\n**Punishment:** ${result}`,
      });
      return;
    }
  }
}

/** Detect a MEMBER gaining a role that has watched permissions. */
async function checkDangerousRoleGain(client, oldM, newM) {
  const guild = newM.guild;
  const cfg = an.getConfig(guild.id);
  if (!cfg.enabled) return;

  const gained = newM.roles.cache.filter((r) => !oldM.roles.cache.has(r.id));
  if (!gained.size) return;

  for (const [permKey, flag] of Object.entries(an.WATCHED_PERMS)) {
    const watch = cfg.permWatch?.[permKey];
    if (!watch?.on) continue;
    const dangerous = gained.find((r) => r.permissions.has(flag));
    if (dangerous) {
      const { executorId } = await an.findActor(guild, AuditLogEvent.MemberRoleUpdate, newM.id, 10000);
      if (!executorId || an.isExempt(guild, executorId, client)) return;

      await newM.roles.remove(dangerous, 'Antinuke: removed dangerous role grant').catch(() => {});
      const result =
        watch.action === 'ban'
          ? await an.punish(client, guild, executorId, 'ban', `Antinuke: gave ${permKey} role`)
          : await an.punish(client, guild, executorId, 'strip', `Antinuke: gave ${permKey} role`);

      await an.log(client, guild, cfg, {
        title: 'Dangerous Role Grant Blocked',
        description: `<@${executorId}> gave <@${newM.id}> the role **${dangerous.name}** (has ${permKey}). Removed.\n**Punishment:** ${result}`,
      });
      return;
    }
  }
}

module.exports = { initAntinuke };
