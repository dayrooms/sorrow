const db = require('../database/db');

/** Apply autoroles + sticky-role restore when a member joins. */
module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    try {
      const data = db.getSettings(member.guild.id, 'autorole', { humans: [], bots: [] });
      const roles = member.user.bot ? data.bots : data.humans;
      const valid = roles.filter((r) => member.guild.roles.cache.has(r));
      if (valid.length) await member.roles.add(valid, 'Autorole').catch(() => {});

      // Sticky roles: restore roles the member had before leaving (if enabled).
      const rl = db.getSettings(member.guild.id, 'rolelink', { sticky: false });
      if (rl.sticky) {
        const stored = db.getSettings(member.guild.id, `stickyroles:${member.id}`, { roles: [] });
        const toRestore = stored.roles.filter((r) => {
          const role = member.guild.roles.cache.get(r);
          return role && role.editable && role.position < member.guild.members.me.roles.highest.position;
        });
        if (toRestore.length) await member.roles.add(toRestore, 'Sticky roles').catch(() => {});
      }
    } catch {}
  },
};
