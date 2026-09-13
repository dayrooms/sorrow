
const{ EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,PermissionFlagsBits  } = require('discord.js');
const { default_prefix ,color,error,owner } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'bans',
	description: 'view a paginated list of banned users',
	aliases:[],
	usage: '\```bans\```',
  category: "moderation",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
        if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else { 
      if(!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({embeds:[{description:`❌ You're missing \`Ban Members\` permission`,color:error}]});
      
      message.guild.bans.fetch().then(async bans => {
        
      
      let i0 = 0;
      let i1 = 10;
      let page = 1;

      let description =
        `Total Bans - ${bans.size}\n\n` +
        bans
        .sort((a, b) => bans.size - bans.size)
        .map(r => r)
        .map(
        (r, i) => `**${i + 1}** - ${r.user.username} | ID - ${r.user.id}`)
          .slice(0, 10)
          .join("\n\n");


               const button1 = new ButtonBuilder()
      .setCustomId('previousbtn')
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary);
            let invite2 = new ButtonBuilder()
         .setLabel('Invite')
         .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
         .setStyle(ButtonStyle.Link)
      const button2 = new ButtonBuilder()
      .setCustomId('nextbtn')
      .setEmoji("➡️ ")
      .setStyle(ButtonStyle.Secondary);
       const button3 = new ButtonBuilder()
      .setCustomId('fastp')
      .setEmoji("❌")
      .setStyle(ButtonStyle.Secondary);



    let buttonList = [
      button1,
      button3,
      button2,
  ]
    const row = new ActionRowBuilder().addComponents(buttonList);
        let embed = new EmbedBuilder()

        .setColor(color)
        .setFooter({text:`Page - ${page}/${Math.ceil(bans.size / 10)}`})
        .setDescription(description);

     const curPage = await message.channel.send({
       embeds:[embed
         ], components:[row]
                                     })
  const filter = (i) =>
    i.customId === buttonList[0].customId ||
    i.customId === buttonList[1].customId || 
    i.customId === buttonList[2].customId;

const collector = await curPage.createMessageComponentCollector({
  //filter,
  filter: i => i.user.id === message.author.id,

});
        collector.on("collect", async (i) => {
          //console.log(i.user.id)
          if(i.user.id !== message.author.id) return;
          switch (i.customId) {
            case buttonList[0].customId:
                i0 = i0 - 10;
                i1 = i1 - 10;
                page = page - 1;
      
                if (i0 + 1 < 0) {
                  console.log(i0)
                  return;
                }
                if (!i0 || !i1) {
                  return 
                }
      
                description =
                  `Total Bans - ${bans.size}\n\n` +
                  bans
                    .map(r => r)
        .map(
        (r, i) => `**${i + 1}** - ${r.user.username} | ID - ${r.user.id}`)
                     .slice(0, 10)
                    .join("\n\n")
                    .slice(i0, i1)
                    .join("\n\n");
      
                embed
                  .setFooter(
                    { text: `Page - ${page}/${Math.round(bans.size / 10 + 1)}` }
                  )
                  .setDescription(description);
      
                  curPage.edit({ embeds: [embed] });
              break;
             case buttonList[1].customId:
              curPage.delete()
              break;
            case buttonList[2].customId:
              i0 = i0 + 10;
              i1 = i1 + 10;
              page = page + 1;
    
              if (i1 > bans.size + 10) {
                return;
              }
              if (!i0 || !i1) {
                return;
              }
    
              description =
                `Total Bans - ${bans.size}\n\n` +
                 bans
                    .map(r => r)
                            .map(
        (r, i) => `**${i + 1}** - ${r.user.username} | ID - ${r.user.id}`)
                     .slice(0, 10)
                  .slice(i0, i1)
                  .join("\n\n");
    
              embed
                .setFooter(
                  {text:`Page - ${page}/${Math.round(bans.size / 10 + 1)}`}
                )
                .setDescription(description);
    
                curPage.edit({ embeds: [embed] });
              break;
            default:
              break;
          }
              await i.deferUpdate();

           collector.resetTimer();
        });
        })
         

	}
    }
};