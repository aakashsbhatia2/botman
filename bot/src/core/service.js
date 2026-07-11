export function createService({ agent }) {
  return {
    async handleMessage(messages) {
      return agent.respond(messages);
    },
  };
}
