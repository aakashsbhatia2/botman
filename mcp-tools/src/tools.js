import { z } from "zod";

function makeThoughts(store) {
  return {
    add: (content, tags = []) => store.save(content, tags),
    query: () => store.listActive(),
    setStatus: (id, status) => store.setStatus(id, status),
  };
}

function text(value) {
  return { content: [{ type: "text", text: String(value) }] };
}

export function registerTools(server, { store, calendar, webSearch }) {
  const thoughts = makeThoughts(store);

  server.registerTool(
    "add_note",
    {
      description:
        "Save a new thought, note, idea, or task the user wants remembered. " +
        "Infer a few short lowercase tags from the content.",
      inputSchema: {
        content: z.string().describe("The thought to save."),
        tags: z
          .array(z.string())
          .optional()
          .describe("A few short lowercase tags categorizing the thought."),
      },
    },
    async ({ content, tags = [] }) => {
      const t = await thoughts.add(content, tags);
      return text(
        `Saved: "${t.content}"${t.tags.length ? ` [${t.tags.join(", ")}]` : ""}`,
      );
    },
  );

  server.registerTool(
    "search_notes",
    {
      description:
        `
        Retrieve ALL of the user's active thoughts. Call this whenever you
        need to answer a question about what they've saved, or perfom any operationson existing notes. 
        Returns each thought's id, content, and tags.
        `,
      inputSchema: {},
    },
    async () => {
      const list = await thoughts.query();
      return text(
        JSON.stringify(
          list.map((t) => ({ id: t.id, content: t.content, tags: t.tags })),
        ),
      );
    },
  );

  server.registerTool(
    "update_status",
    {
      description:
        "Change a thought's status. Use 'done' when the user finishes " +
        "something, or 'archived' to set it aside. Get the id from search_notes.",
      inputSchema: {
        id: z.string().describe("The thought's id."),
        status: z
          .enum(["active", "done", "archived"])
          .describe("The new status."),
      },
    },
    async ({ id, status }) => {
      await thoughts.setStatus(id, status);
      return text(`Marked ${id} as ${status}.`);
    },
  );

  server.registerTool(
    "create_calendar_event",
    {
      description:
        "Create an event on the user's Google Calendar. Use this when they " +
        "want to schedule something at a specific time (a meeting, call, " +
        "appointment, or time-block). If they mention people to invite, add " +
        "their email addresses as attendees and they'll be emailed an invite.",
      inputSchema: {
        title: z.string().describe("The event title."),
        start: z
          .string()
          .describe(
            "Start time as ISO 8601 local time with NO timezone offset, " +
              "e.g. '2026-07-01T15:00:00'. The server applies the user's " +
              "timezone.",
          ),
        end: z
          .string()
          .optional()
          .describe(
            "End time in the same format. Optional — defaults to one hour " +
              "after start.",
          ),
        description: z
          .string()
          .optional()
          .describe("Optional event notes/description."),
        attendees: z
          .array(z.string())
          .optional()
          .describe("Optional list of guest email addresses to invite."),
      },
    },
    async ({ title, start, end, description, attendees }) => {
      const event = await calendar.createEvent({
        title,
        start,
        end,
        description,
        attendees,
      });
      const invited = attendees?.length
        ? ` Invited: ${attendees.join(", ")}.`
        : "";
      return text(
        `Created event "${event.title}" starting ${event.start}.${invited} Link: ${event.link}`,
      );
    },
  );

  if (webSearch) {
    server.registerTool(
      "web_search",
      {
        description:
          "Search the web for current or factual information that is not in " +
          "the user's notes (news, weather, prices, facts, how-to, recent " +
          "events). Returns a short answer and source results with title, " +
          "url, and content.",
        inputSchema: {
          query: z.string().describe("The search query."),
        },
      },
      async ({ query }) => {
        const { answer, results } = await webSearch.search(query);
        return text(JSON.stringify({ answer, results }));
      },
    );
  }
}
