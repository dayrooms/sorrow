const db = require('../database/db');

/** Save a member's roles when they leave so `role restore` / sticky roles work. */
module.exports = {
  name: 'guildMemberRemove',
  execute(client, member) {
    try {
      const roles = member.roles.cache.filter((r) => r.id !== member.guild.id).map((r) => r.id);
      if (roles.length) db.saveSettings(member.guild.id, `stickyroles:${member.id}`, { roles });
    } catch {}
  },
};
