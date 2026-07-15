import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const MAX_CHARS = 8000;

export function createFetcher() {
  return {
    async fetchReadable(url) {
      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; botman/0.1; +https://github.com)",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`Fetch failed (${res.status}) for ${url}`);
      }

      const html = await res.text();
      const { document } = parseHTML(html);
      const article = new Readability(document).parse();

      const raw = article?.textContent ?? document.body?.textContent ?? "";
      const content = raw.replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_CHARS);

      return {
        url,
        title: article?.title ?? document.title ?? "",
        content,
      };
    },
  };
}
