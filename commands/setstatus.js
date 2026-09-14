const { EmbedBuilder, ActivityType } = require('discord.js');
const { color, error, checked, xmark, owner } = require("../config.json");

const ACTIVITY_TYPES = {
	playing: ActivityType.Playing,
	watching: ActivityType.Watching,
	listening: ActivityType.Listening,
	competing: ActivityType.Competing,
};

const PRESENCE_STATUSES = ['online', 'idle', 'dnd', 'invisible'];

module.exports = {
	name: 'setstatus',
	description: "change the bot's own status and activity (owner only)",
	aliases: ["botstatus", "presence"],
	usage: ';setstatus online|idle|dnd|invisible\n;setstatus <playing|watching|listening|competing> <text>',
	category: "owner",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (message.author.id !== owner) return;

		const first = args[0] ? args[0].toLowerCase() : null;

		if (PRESENCE_STATUSES.includes(first)) {
			client.user.setStatus(first);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Status set to **${first}**`).setColor(color)] });
		}

		if (ACTIVITY_TYPES[first]) {
			const text = args.slice(1).join(' ');
			if (!text) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide activity text, e.g. \`;setstatus watching over the server\``).setColor(error)] });
			client.user.setActivity(text, { type: ACTIVITY_TYPES[first] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Activity set to **${first} ${text}**`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Usage:\n\`;setstatus online/idle/dnd/invisible\`\n\`;setstatus playing/watching/listening/competing <text>\``).setColor(color)] });
	},
};
