const { EmbedBuilder } = require('discord.js');
const { color, owner } = require("../config.json")

module.exports = {
	name: 'eval',
	description: 'runs raw JavaScript code (owner only)',
	aliases: ["ev"],
	usage: ';eval <code>',
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async (message, args, client) => {
		const db = client.db;

		if (message.author.id !== owner) return;
		if (!args.length) return message.reply({ embeds: [new EmbedBuilder().setDescription('❌ Provide code to run').setColor(color)] });

		const clean = text => {
			if (typeof text === "string")
				return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
			return text;
		}

		try {
			const code = args.join(" ");
			let evaled = eval(code);

			if (evaled instanceof Promise) evaled = await evaled;
			if (typeof evaled !== "string") evaled = require("util").inspect(evaled);

			message.react('✅').catch(() => {});
			return message.reply({ content: `\`\`\`js\n${clean(evaled).slice(0, 1900)}\n\`\`\`` });
		} catch (err) {
			message.react('❌').catch(() => {});
			return message.reply({ content: `\`\`\`js\n${clean(err.message || String(err))}\n\`\`\`` });
		}
	},
};
