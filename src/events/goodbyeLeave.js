const db = require('../database/db');
const { buildMessage } = require('../utils/messageBuilder');

/** Fire goodbye on member leave. */
module.exports = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    try {
      const goodbye = db.getSettings(member.guild.id, 'goodbye', { channel: null, message: null });
      if (goodbye.message && goodbye.channel) {
        const ch = member.guild.channels.cache.get(goodbye.channel);
        if (ch?.isTextBased()) ch.send(buildMessage(goodbye.message, { user: member.user, member, guild: member.guild })).catch(() => {});
      }
    } catch {}
  },
};
