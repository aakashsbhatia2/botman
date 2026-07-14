import { config } from "../config.js";

const TAVILY_URL = "https://api.tavily.com/search";

export function createWebSearch() {
  return {
    async search(query, maxResults = 5) {
      const res = await fetch(TAVILY_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          api_key: config.tavilyApiKey,
          query,
          max_results: maxResults,
          include_answer: true,
        }),
      });

      if (!res.ok) {
        throw new Error(
          `Tavily search failed (${res.status}): ${await res.text()}`,
        );
      }

      const data = await res.json();
      return {
        answer: data.answer ?? "",
        results: (data.results ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
        })),
      };
    },
  };
}
