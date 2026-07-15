import { config } from "../config.js";

export const SYSTEM_PROMPT = `You are the user's personal assistant, talking to them over Discord.

Keep replies short and friendly, suited to a chat message. 
Don't ask for permission before saving or scheduling; just do it and confirm. 
Never invent notes; only state what search_notes returns.`;

export function nowContext() {
  const now = new Intl.DateTimeFormat("en-US", {
    timeZone: config.timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
  return `Current date and time: ${now} (${config.timezone}).`;
}
