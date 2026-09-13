const { ActivityType } = require('discord.js');

module.exports = {
  event: "ready",
  once: true,
  execute: async (client) => {
    client.readyOn = Date.now();
    console.log(`Bot ready as ${client.user.tag}`);

    client.user.setPresence({ status: "online" });

    const updatePresence = () => {
      client.user.setActivity(`${client.guilds.cache.size} servers`, {
        type: ActivityType.Watching
      });
    };

    updatePresence();
    setInterval(updatePresence, 300000);

    // Tempban checker — runs every 60 seconds, unbanning anyone whose tempban expired
    const checkTempbans = async () => {
      try {
        const db = client.db;
        let tempbans = await db.get(`tempbans`) || [];
        if (!tempbans.length) return;

        const now = Date.now();
        const stillActive = [];
        for (const entry of tempbans) {
          if (entry.unbanAt <= now) {
            const guild = client.guilds.cache.get(entry.guildId);
            if (guild) {
              await guild.members.unban(entry.userId, "Tempban expired").catch(() => {});
            }
          } else {
            stillActive.push(entry);
          }
        }
        await db.set(`tempbans`, stillActive);
      } catch (err) {
        console.error("Tempban checker error:", err);
      }
    };
    checkTempbans();
    setInterval(checkTempbans, 60000);

    // Temprole checker — removes temporary roles once they expire
    const checkTemproles = async () => {
      try {
        const db = client.db;
        let temproles = await db.get(`temproles`) || [];
        if (!temproles.length) return;

        const now = Date.now();
        const stillActive = [];
        for (const entry of temproles) {
          if (entry.expiresAt <= now) {
            const guild = client.guilds.cache.get(entry.guildId);
            if (guild) {
              const member = await guild.members.fetch(entry.userId).catch(() => null);
              if (member) await member.roles.remove(entry.roleId).catch(() => {});
            }
          } else {
            stillActive.push(entry);
          }
        }
        await db.set(`temproles`, stillActive);
      } catch (err) {
        console.error("Temprole checker error:", err);
      }
    };
    checkTemproles();
    setInterval(checkTemproles, 60000);
  },
};
