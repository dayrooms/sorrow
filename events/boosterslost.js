module.exports = {
  event: "guildMemberUpdate",
  execute: async (oldMember, newMember, client) => {
    try {
      if (oldMember.premiumSince && !newMember.premiumSince) {
        const db = client.db;
        let lost = await db.get(`boosterslost_${newMember.guild.id}`) || [];
        lost.push({ tag: newMember.user.tag, id: newMember.id, timestamp: Date.now() });
        lost = lost.slice(-100);
        await db.set(`boosterslost_${newMember.guild.id}`, lost);
      }
    } catch {}
  },
};
