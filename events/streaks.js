module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      const db = client.db;
      const enabled = await db.get(`streaksenabled_${message.guild.id}`);
      if (!enabled) return;

      const allStreaks = await db.get(`streaks_${message.guild.id}`) || {};
      const mine = allStreaks[message.author.id] || { current: 0, longest: 0, lastDay: null };

      const today = new Date().toISOString().slice(0, 10);
      if (mine.lastDay === today) return; // already counted today

      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (mine.lastDay === yesterday) {
        mine.current += 1;
      } else {
        mine.current = 1;
      }
      mine.longest = Math.max(mine.longest, mine.current);
      mine.lastDay = today;

      allStreaks[message.author.id] = mine;
      await db.set(`streaks_${message.guild.id}`, allStreaks);
    } catch {}
  },
};
