const { AuditLogEvent } = require('discord.js');
const db = require('../database/db');
const { base } = require('./embed');
const config = require('../config');

/** Attach all audit-logging listeners. Called from ready. */
function initLogging(client) {
  const send = (guild, eventKey, embed) => {
    if (!guild) return;
    const cfg = db.getSettings(guild.id, 'logging', { channel: null, events: {} });
    const chId = cfg.events?.[eventKey] || cfg.channel;
    if (!chId) return;
    const ch = guild.channels.cache.get(chId);
    if (ch?.isTextBased()) ch.send({ embeds: [embed.setTimestamp()] }).catch(() => {});
  };

  client.on('messageDelete', (msg) => {
    if (!msg.guild || msg.author?.bot) return;
    send(msg.guild, 'messageDelete', base(config.colors.error).setAuthor({ name: msg.author?.tag || 'Unknown', iconURL: msg.author?.displayAvatarURL() }).setDescription(`🗑️ **Message deleted** in ${msg.channel}\n${msg.content?.slice(0, 1024) || '*[no text]*'}`));
  });

  client.on('messageUpdate', (oldM, newM) => {
    if (!newM.guild || newM.author?.bot || oldM.content === newM.content) return;
    send(newM.guild, 'messageEdit', base(config.colors.warn).setAuthor({ name: newM.author?.tag || 'Unknown', iconURL: newM.author?.displayAvatarURL() }).setDescription(`✏️ **Message edited** in ${newM.channel} — [jump](${newM.url})\n**Before:** ${oldM.content?.slice(0, 500) || '*unknown*'}\n**After:** ${newM.content?.slice(0, 500)}`));
  });

  client.on('messageDeleteBulk', (messages) => {
    const first = messages.first();
    if (!first?.guild) return;
    send(first.guild, 'messageBulkDelete', base(config.colors.error).setDescription(`🗑️ **${messages.size}** messages bulk-deleted in ${first.channel}`));
  });

  client.on('guildMemberAdd', (m) => {
    send(m.guild, 'memberJoin', base(config.colors.success).setAuthor({ name: m.user.tag, iconURL: m.user.displayAvatarURL() }).setDescription(`📥 <@${m.id}> joined.\nAccount created <t:${Math.floor(m.user.createdTimestamp / 1000)}:R>`));
  });
  client.on('guildMemberRemove', (m) => {
    send(m.guild, 'memberLeave', base(config.colors.error).setAuthor({ name: m.user.tag, iconURL: m.user.displayAvatarURL() }).setDescription(`📤 <@${m.id}> left. Roles: ${m.roles?.cache.filter((r) => r.id !== m.guild.id).map((r) => r.name).join(', ') || 'none'}`));
  });
  client.on('guildBanAdd', (ban) => {
    send(ban.guild, 'memberBan', base(config.colors.error).setDescription(`🔨 **${ban.user.tag}** was banned.`));
  });
  client.on('guildBanRemove', (ban) => {
    send(ban.guild, 'memberUnban', base(config.colors.success).setDescription(`♻️ **${ban.user.tag}** was unbanned.`));
  });

  client.on('guildMemberUpdate', (oldM, newM) => {
    if (oldM.nickname !== newM.nickname) {
      send(newM.guild, 'nicknameChange', base(config.colors.info).setDescription(`📝 <@${newM.id}> nickname: **${oldM.nickname || 'none'}** → **${newM.nickname || 'none'}**`));
    }
  });

  client.on('channelCreate', (ch) => ch.guild && send(ch.guild, 'channelCreate', base(config.colors.success).setDescription(`➕ Channel created: ${ch} (**${ch.name}**)`)));
  client.on('channelDelete', (ch) => ch.guild && send(ch.guild, 'channelDelete', base(config.colors.error).setDescription(`➖ Channel deleted: **${ch.name}**`)));
  client.on('roleCreate', (r) => send(r.guild, 'roleCreate', base(config.colors.success).setDescription(`➕ Role created: **${r.name}**`)));
  client.on('roleDelete', (r) => send(r.guild, 'roleDelete', base(config.colors.error).setDescription(`➖ Role deleted: **${r.name}**`)));

  client.on('voiceStateUpdate', (oldS, newS) => {
    const guild = newS.guild;
    if (!oldS.channelId && newS.channelId) send(guild, 'voiceJoin', base(config.colors.success).setDescription(`🔊 <@${newS.id}> joined **${newS.channel.name}**`));
    else if (oldS.channelId && !newS.channelId) send(guild, 'voiceLeave', base(config.colors.error).setDescription(`🔇 <@${newS.id}> left **${oldS.channel.name}**`));
    else if (oldS.channelId !== newS.channelId) send(guild, 'voiceMove', base(config.colors.info).setDescription(`↔️ <@${newS.id}> moved **${oldS.channel?.name}** → **${newS.channel?.name}**`));
  });

  client.logger.info('Logging listeners attached.');
}

module.exports = { initLogging };
