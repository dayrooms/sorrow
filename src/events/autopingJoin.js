const db = require('../database/db');

/** Autoping members when they join. */
module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    try {
      const data = db.getSettings(member.guild.id, 'autoping', { channels: [] });
      for (const chId of data.channels) {
        const ch = member.guild.channels.cache.get(chId);
        if (ch?.isTextBased()) {
          const m = await ch.send(`<@${member.id}>`).catch(() => null);
          if (m) setTimeout(() => m.delete().catch(() => {}), 3000);
        }
      }
    } catch {}
  },
};
