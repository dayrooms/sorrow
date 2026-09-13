module.exports = {
  event: "guildMemberRemove",
  execute: async (member, client) => {
    try {
      const db = client.db;
      const counters = await db.get(`counters_${member.guild.id}`) || [];
      if (!counters.length) return;

      for (const c of counters) {
        const channel = member.guild.channels.cache.get(c.channelId);
        if (!channel) continue;
        let count = 0;
        if (c.type === 'members') count = member.guild.memberCount;
        else if (c.type === 'humans') count = member.guild.members.cache.filter(m => !m.user.bot).size;
        else if (c.type === 'bots') count = member.guild.members.cache.filter(m => m.user.bot).size;
        else if (c.type === 'boosts') count = member.guild.premiumSubscriptionCount || 0;
        const newName = `${c.label}: ${count}`;
        if (channel.name !== newName) await channel.setName(newName).catch(() => {});
      }
    } catch {}
  },
};
