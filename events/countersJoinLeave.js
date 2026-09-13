async function updateCounters(guild, client) {
  try {
    const db = client.db;
    const counters = await db.get(`counters_${guild.id}`) || [];
    if (!counters.length) return;

    for (const c of counters) {
      const channel = guild.channels.cache.get(c.channelId);
      if (!channel) continue;
      let count = 0;
      if (c.type === 'members') count = guild.memberCount;
      else if (c.type === 'humans') count = guild.members.cache.filter(m => !m.user.bot).size;
      else if (c.type === 'bots') count = guild.members.cache.filter(m => m.user.bot).size;
      else if (c.type === 'boosts') count = guild.premiumSubscriptionCount || 0;
      const newName = `${c.label}: ${count}`;
      if (channel.name !== newName) await channel.setName(newName).catch(() => {});
    }
  } catch {}
}

module.exports = {
  event: "guildMemberAdd",
  execute: async (member, client) => {
    await updateCounters(member.guild, client);
  },
};
