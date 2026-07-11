import Anthropic from "@anthropic-ai/sdk";
import { config, MODEL } from "../config.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { withToolSession } from "./tools.js";

const MAX_TOOL_ITERATIONS = 8;

function textOf(message) {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

function nowContext() {
  const now = new Intl.DateTimeFormat("en-US", {
    timeZone: config.timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
  return `Current date and time: ${now} (${config.timezone}).`;
}

export function createAgent() {
  let client;
  function anthropic() {
    if (!client) {
      client = new Anthropic({
        apiKey: config.anthropicApiKey,
        baseURL: config.llmGatewayUrl,
      });
    }
    return client;
  }

  return {
    async respond(text) {
      return withToolSession(async (session) => {
        const definitions = await session.listDefinitions();
        const system = `${SYSTEM_PROMPT}\n\n${nowContext()}`;
        const messages = [{ role: "user", content: text }];

        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const message = await anthropic().messages.create({
            model: MODEL,
            max_tokens: 1024,
            system,
            tools: definitions,
            messages,
          });

          if (message.stop_reason !== "tool_use") {
            return textOf(message);
          }

          messages.push({ role: "assistant", content: message.content });

          const toolResults = [];
          for (const block of message.content) {
            if (block.type !== "tool_use") continue;
            let result;
            try {
              result = await session.call(block.name, block.input);
            } catch (err) {
              console.error(`[agent] tool ${block.name} failed:`, err);
              result = `Error: ${err.message}`;
            }
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: String(result),
            });
          }

          messages.push({ role: "user", content: toolResults });
        }

        console.warn(`[agent] hit max tool iterations (${MAX_TOOL_ITERATIONS})`);
        return "I got a bit stuck working through that — could you rephrase?";
      });
    },
  };
}
