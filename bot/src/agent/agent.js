import OpenAI from "openai";
import { config } from "../config.js";
import { SYSTEM_PROMPT, nowContext } from "./prompts.js";
import { withToolSession } from "./tools.js";

const MAX_TOOL_ITERATIONS = 8;

export function createAgent() {
  let client;
  function llm() {
    if (!client) {
      client = new OpenAI({
        baseURL: config.llmBaseUrl,
        apiKey: config.llmApiKey,
      });
    }
    return client;
  }

  return {
    async respond(history) {
      return withToolSession(async (session) => {
        const tools = await session.listOpenAITools();
        const toolParams = Object.fromEntries(
          tools.map((t) => [t.function.name, t.function.parameters]),
        );
        const system = `${SYSTEM_PROMPT}\n\n${nowContext()}`;
        const messages = [{ role: "system", content: system }, ...history];

        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const completion = await llm().chat.completions.create({
            model: config.llmModel,
            max_tokens: 1024,
            tools,
            tool_choice: "auto",
            messages,
          });

          const message = completion.choices[0].message;

          if (!message.tool_calls?.length) {
            console.log("[agent] model returned text, no tool call");
            return (message.content ?? "").trim();
          }

          messages.push(message);

          for (const call of message.tool_calls) {
            console.log(`[agent] tool call: ${call.function.name}`);
            console.log(`[agent]   sent:    ${call.function.arguments}`);
            console.log(
              `[agent]   accepts: ${JSON.stringify(toolParams[call.function.name])}`,
            );
            let result;
            try {
              const args = call.function.arguments
                ? JSON.parse(call.function.arguments)
                : {};
              result = await session.call(call.function.name, args);
            } catch (err) {
              console.error(`[agent] tool ${call.function.name} failed:`, err);
              result = `Error: ${err.message}`;
            }
            console.log(`[agent]   result:  ${String(result)}`);
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: String(result),
            });
          }
        }

        console.warn(`[agent] hit max tool iterations (${MAX_TOOL_ITERATIONS})`);
        return "I got a bit stuck working through that. Could you rephrase?";
      });
    },
  };
}
