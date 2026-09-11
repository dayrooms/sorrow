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
  },
};
