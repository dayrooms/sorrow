module.exports = {
  event: "guildMemberRemove",
  execute: async (member, client) => {
    try {
      const db = client.db;
      let leaves = await db.get(`recentleaves_${member.guild.id}`) || [];
      leaves.push({ tag: member.user.tag, id: member.id, timestamp: Date.now() });
      // Keep only the last 100 entries so this doesn't grow unbounded
      leaves = leaves.slice(-100);
      await db.set(`recentleaves_${member.guild.id}`, leaves);
    } catch {}
  },
};
