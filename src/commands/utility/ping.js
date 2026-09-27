const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base } = require('../../utils/embed');

module.exports = new Command({
  name: 'ping',
  aliases: ['pong', 'latency'],
  description: "Check the bot's latency.",
  permLevel: LEVELS.USER,
  cooldown: 3000,
  async run({ client, message }) {
    const sent = await message.channel.send({
      embeds: [base().setDescription('Pinging...')],
    });
    const rtt = sent.createdTimestamp - message.createdTimestamp;
    const ws = Math.round(client.ws.ping);
    await sent.edit({
      embeds: [
        base()
          .setTitle('🏓 Pong')
          .setDescription(`**Message:** \`${rtt}ms\`\n**WebSocket:** \`${ws}ms\``),
      ],
    });
  },
});
