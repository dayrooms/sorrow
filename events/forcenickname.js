module.exports = {
  event: "guildMemberUpdate",
  execute: async (oldMember, newMember, client) => {
    try {
      const db = client.db;
      const forced = await db.get(`forcenick_${newMember.guild.id}_${newMember.id}`);
      if (!forced) return;
      if (newMember.nickname === forced) return;
      await newMember.setNickname(forced).catch(() => {});
    } catch {}
  },
};
