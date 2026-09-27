const db = require('../database/db');
const { buildMessage } = require('../utils/messageBuilder');

/** Fire boost message when a member starts boosting. */
module.exports = {
  name: 'guildMemberUpdate',
  async execute(client, oldM, newM) {
    try {
      if (!oldM.premiumSince && newM.premiumSince) {
        const boosts = db.getSettings(newM.guild.id, 'boosts', { channel: null, message: null });
        if (boosts.message && boosts.channel) {
          const ch = newM.guild.channels.cache.get(boosts.channel);
          if (ch?.isTextBased()) ch.send(buildMessage(boosts.message, { user: newM.user, member: newM, guild: newM.guild })).catch(() => {});
        }
      }
    } catch {}
  },
};
