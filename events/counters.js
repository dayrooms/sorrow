module.exports = {
  event: "guildMemberUpdate",
  execute: async (oldMember, newMember, client) => {
    // Fires on boost status changes too (premiumSince), so this alone
    // covers most counter update triggers without a separate interval.
    try {
      const db = client.db;
      const counters = await db.get(`counters_${newMember.guild.id}`) || [];
      if (!counters.length) return;

      for (const c of counters) {
        const channel = newMember.guild.channels.cache.get(c.channelId);
        if (!channel) continue;
        let count = 0;
        if (c.type === 'members') count = newMember.guild.memberCount;
        else if (c.type === 'humans') count = newMember.guild.members.cache.filter(m => !m.user.bot).size;
        else if (c.type === 'bots') count = newMember.guild.members.cache.filter(m => m.user.bot).size;
        else if (c.type === 'boosts') count = newMember.guild.premiumSubscriptionCount || 0;
        const newName = `${c.label}: ${count}`;
        if (channel.name !== newName) await channel.setName(newName).catch(() => {});
      }
    } catch {}
  },
};
