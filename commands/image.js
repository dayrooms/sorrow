
const{ EmbedBuilder,ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios')
const { default_prefix ,color,error,owner,xmark } = require("../config.json")
const talkedRecently = new Set();
module.exports = {
	name: 'image',
	description: '',
	aliases:['img'],
	usage: '\```img luckys face reveal \```',
  category: "utility",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async(message, args, client) => {
    const db = client.db;
  let pingemoji = `📶`

        if (talkedRecently.has(message.author.id)) {
             message.react(`⌛`)
    } else {

            
      const query = args.join(" ")
      axios.get(`https://serpapi.com/search?api_key=175a159f608db9bf269333797196e822da6ce84a3993031c305cb5e6d594df13&engine=google&q=${query}&location=United&20States&google_domain=google.com&gl=us&hl=en&tbm=isch&ijn=1`)
      .then(async response => {
        
      
    let i0 = 0;
      let i1 = 1;
      let page = 1;

      let description =
          `**results for ${query} - ${response.data.images_results.length}\n\n **`


               const button1 = new ButtonBuilder()
      .setCustomId('previousbtn')
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Primary);
            let invite2 = new ButtonBuilder()
         .setLabel('Invite')
         .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
         .setStyle(ButtonStyle.Link)
      const button2 = new ButtonBuilder()
      .setCustomId('nextbtn')
      .setEmoji("➡️ ")
      .setStyle(ButtonStyle.Primary);
       const button3 = new ButtonBuilder()
      .setCustomId('fastp')
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger);



    let buttonList = [
      button1,
      button3,
      button2,
  ]
    const row = new ActionRowBuilder().addComponents(buttonList);
        let embed = new EmbedBuilder()
        .setAuthor({name:`${message.author.tag}`,iconURL:`${message.author.displayAvatarURL({dynamic:true,size:4096})}`})
        .setColor(color)
        .setImage(response.data.images_results[0].original)
        .setFooter({text:`Page - ${page}/${Math.ceil(response.data.images_results.length)}`})
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
                i0 = i0 - 1;
                i1 = i1 - 1;
                page = page - 1;
      
                if (i0 + 1 < 0) {
                  console.log(i0)
                  return;
                }
                if (!i0 || !i1) {
                  return 
                }
      
                description =
                  `**results for ${query} - ${response.data.images_results.length}\n\n **`
      
                embed
                 .setAuthor({name:`${message.author.tag}`,iconURL:`${message.author.displayAvatarURL({dynamic:true,size:4096})}`})
                  .setFooter(
                    { text: `Page - ${page}/${Math.round(response.data.images_results.length / 1 + 1)}` }
                  )
                  .setDescription(description)
                 .setImage(response.data.images_results[i0].original)
                  curPage.edit({ embeds: [embed] });
              break;
             case buttonList[1].customId:
              curPage.delete()
              break;
            case buttonList[2].customId:
              i0 = i0 + 1;
              i1 = i1 + 1;
              page = page + 1;
    
              if (i1 > response.data.images_results.length + 1) {
                return;
              }
              if (!i0 || !i1) {
                return;
              }
    
              description =
               `**results for ${query} - ${response.data.images_results.length}\n\n **`

    
              embed
               .setAuthor({name:`${message.author.tag}`,iconURL:`${message.author.displayAvatarURL({dynamic:true,size:4096})}`})
                .setImage(response.data.images_results[i0].original)
                .setFooter(
                  {text:`Page - ${page}/${Math.round(response.data.images_results.length / 1 + 1)}`}
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
      
      
        // Adds the user to the set so that they can't talk for a minute
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(message.author.id);
        }, 3500);
    }

	},
};