import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config.js";

export function createDiscordBot({ service }) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`[discord] logged in as ${c.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.author.id !== config.ownerUserId) return;

    try {
      await message.channel.sendTyping();
      const reply = await service.handleMessage(
        message.author.id,
        message.content,
      );
      if (reply) for (const part of chunk(reply)) await message.reply(part);
    } catch (err) {
      console.error("[discord] failed to handle message:", err);
      await message.reply("Something went wrong handling that. Check the logs.");
    }
  });

  function chunk(text, size = 1900) {
    const parts = [];
    let buf = "";
    for (const line of text.split("\n")) {
      if (buf.length + line.length + 1 > size) {
        if (buf) parts.push(buf);
        buf = "";
      }
      buf += (buf ? "\n" : "") + line;
    }
    if (buf) parts.push(buf);
    return parts;
  }

  return {
    async start() {
      await client.login(config.discordToken);
    },
  };
}
