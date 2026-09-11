
const { EmbedBuilder } = require('discord.js');
const { owner } = require("../config.json")
module.exports = {
    name: 'restart',
    description: 'Restart the bot via PM2.',
    aliases: ["reboot"],
    usage: 'restart',
    guildOnly: false,
    args: false,
    permissions: {
        bot: [],
        user: [],
    },
    execute: async (message, args, client) => {
        var permissionDenied = new EmbedBuilder()
            .setColor("#8B0000")
            .setAuthor({ name: "Error Occured" })
            .setTitle("Permission Denied")
            .setDescription("You do not have permission to use this command. This command is only available to the bot owner.")
            .setTimestamp()
            .setFooter({
                text: `${client.user.username}`,
                iconURL: client.user.displayAvatarURL()
            });
        var loadingEmbed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle("Restarting Bot ⏳")
            .setDescription("Please wait while the bot is being restarted. This may take a few minutes.")
            .setTimestamp()
            .setFooter({
                text: `${client.user.username}`,
                iconURL: client.user.displayAvatarURL()
            });
        if (owner.toString() !== message.author.id.toString()) return message.reply({ embeds: [permissionDenied] })
        await message.reply({ embeds: [loadingEmbed] })
        // Exit cleanly — your host (Render, Pella, PM2, etc.) will automatically
        // restart the process since it monitors and relaunches on exit.
        setTimeout(() => process.exit(0), 500)
    }
};
