import "dotenv/config";

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  ownerUserId: process.env.OWNER_USER_ID,
  timezone: process.env.TIMEZONE,
  mcpServerUrl: process.env.MCP_SERVER_URL,
  historyLimit: Number(process.env.HISTORY_LIMIT) || 0,
  llmBaseUrl: process.env.LLM_BASE_URL,
  llmApiKey: process.env.LLM_API_KEY,
  llmModel: process.env.LLM_MODEL,
};
