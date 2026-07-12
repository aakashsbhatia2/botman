import { config } from "./config.js";
import { createService } from "./core/service.js";
import { createAgent } from "./agent/agent.js";
import { createDiscordBot } from "./discord.js";

async function main() {
  console.log(
    `[server] starting (model: ${config.llmModel}, endpoint: ${config.llmBaseUrl})`,
  );

  const agent = createAgent();
  const service = createService({ agent });

  const bot = createDiscordBot({ service });
  await bot.start();

  console.log("[server] up");
}

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[server] uncaught exception:", err);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`[server] received ${signal}, shutting down`);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
