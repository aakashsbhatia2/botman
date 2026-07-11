import "dotenv/config";

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  ownerUserId: process.env.OWNER_USER_ID,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  timezone: process.env.TIMEZONE,
  mcpServerUrl: process.env.MCP_SERVER_URL,
  llmGatewayUrl: process.env.LLM_GATEWAY_URL,
};

export const MODEL = process.env.MODEL;
