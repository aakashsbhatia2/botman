import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { config } from "../config.js";

function toOpenAITool(tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  };
}

function textOf(result) {
  return (result.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export async function withToolSession(fn) {
  const transport = new StreamableHTTPClientTransport(
    new URL(config.mcpServerUrl),
  );
  const client = new Client({ name: "personal-server-bot", version: "0.1.0" });
  await client.connect(transport);

  const session = {
    async listOpenAITools() {
      const { tools } = await client.listTools();
      return tools.map(toOpenAITool);
    },

    async call(name, input) {
      const result = await client.callTool({ name, arguments: input });
      return textOf(result);
    },
  };

  try {
    return await fn(session);
  } finally {
    await client.close();
  }
}
