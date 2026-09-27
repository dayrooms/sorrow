const db = require('../database/db');
const { buildMessage } = require('../utils/messageBuilder');

/** Fire welcome + joindm on member join. (Autorole handled in autoroleJoin.js) */
module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    if (member.pending) return; // wait until they pass screening — handled again on update
    await sendWelcome(client, member);
  },
};

async function sendWelcome(client, member) {
  try {
    const ctx = { user: member.user, member, guild: member.guild, channel: null };
    const welcome = db.getSettings(member.guild.id, 'welcome', { channel: null, message: null });
    if (welcome.message && welcome.channel) {
      const ch = member.guild.channels.cache.get(welcome.channel);
      if (ch?.isTextBased()) ch.send(buildMessage(welcome.message, ctx)).catch(() => {});
    }
    const joindm = db.getSettings(member.guild.id, 'joindm', { message: null });
    if (joindm.message) member.send(buildMessage(joindm.message, ctx)).catch(() => {});
  } catch {}
}

module.exports.sendWelcome = sendWelcome;
