export function createService({ agent }) {
  return {
    async handleMessage(userId, text) {
      return agent.respond(text);
    },
  };
}
