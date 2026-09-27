const db = require('../database/db');

/** Auto re-ban hardbanned users the moment they rejoin. */
module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    try {
      const hb = db.getSettings(member.guild.id, 'hardban', { ids: [] });
      if (hb.ids.includes(member.id)) {
        await member.ban({ reason: 'Hardban: auto re-ban on rejoin' }).catch(() => {});
      }
    } catch {}
  },
};
