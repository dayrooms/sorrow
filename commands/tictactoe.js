const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { color, error, checked } = require("../config.json");

function renderBoard(board, disabled) {
	const rows = [];
	for (let r = 0; r < 3; r++) {
		const row = new ActionRowBuilder();
		for (let c = 0; c < 3; c++) {
			const i = r * 3 + c;
			const val = board[i];
			row.addComponents(
				new ButtonBuilder()
					.setCustomId(`ttt_${i}`)
					.setLabel(val || '\u200b')
					.setStyle(val === 'X' ? ButtonStyle.Danger : val === 'O' ? ButtonStyle.Primary : ButtonStyle.Secondary)
					.setDisabled(disabled || !!val)
			);
		}
		rows.push(row);
	}
	return rows;
}

function checkWinner(board) {
	const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
	for (const [a,b,c] of lines) {
		if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
	}
	if (board.every(x => x)) return 'draw';
	return null;
}

module.exports = {
	name: 'tictactoe',
	description: 'play tic-tac-toe against another member',
	aliases: ["ttt"],
	usage: ';tictactoe @user',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const opponent = message.mentions.users.first();
		if (!opponent || opponent.bot || opponent.id === message.author.id) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Mention another member to challenge`).setColor(error)] });
		}

		const board = Array(9).fill(null);
		let turn = message.author.id; // X starts
		const symbols = { [message.author.id]: 'X', [opponent.id]: 'O' };

		const msg = await message.reply({
			embeds: [new EmbedBuilder().setDescription(`❌ ${message.author} vs ⭕ ${opponent}\n\nIt's <@${turn}>'s turn (X)`).setColor(color)],
			components: renderBoard(board, false),
		});

		const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });
		collector.on('collect', async i => {
			if (i.user.id !== turn) return i.reply({ content: `❌ It's not your turn`, ephemeral: true });
			const index = parseInt(i.customId.split('_')[1]);
			if (board[index]) return i.reply({ content: `❌ That spot is taken`, ephemeral: true });

			board[index] = symbols[i.user.id];
			const winner = checkWinner(board);

			if (winner === 'draw') {
				await i.update({ embeds: [new EmbedBuilder().setDescription(`🤝 It's a draw!`).setColor(color)], components: renderBoard(board, true) });
				return collector.stop();
			}
			if (winner) {
				const winnerId = Object.keys(symbols).find(id => symbols[id] === winner);
				await i.update({ embeds: [new EmbedBuilder().setDescription(`${checked} <@${winnerId}> wins!`).setColor(color)], components: renderBoard(board, true) });
				return collector.stop();
			}

			turn = turn === message.author.id ? opponent.id : message.author.id;
			await i.update({ embeds: [new EmbedBuilder().setDescription(`❌ ${message.author} vs ⭕ ${opponent}\n\nIt's <@${turn}>'s turn`).setColor(color)], components: renderBoard(board, false) });
		});

		collector.on('end', (collected, reason) => {
			if (reason === 'time') msg.edit({ components: renderBoard(board, true) }).catch(() => {});
		});
	},
};
