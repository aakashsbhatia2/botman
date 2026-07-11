import { Client } from "@notionhq/client";
import { config } from "../config.js";

const PROP = {
  content: "Name",
  tags: "Tags",
  status: "Status",
};

function toThought(page) {
  const props = page.properties;
  const titleItems = props[PROP.content]?.title ?? [];
  return {
    id: page.id,
    content: titleItems.map((t) => t.plain_text).join("").trim(),
    tags: (props[PROP.tags]?.multi_select ?? []).map((t) => t.name),
    status: props[PROP.status]?.select?.name ?? "active",
    created: page.created_time,
  };
}

export function createNotionStore() {
  const notion = new Client({ auth: config.notionToken });

  let dataSourceIdPromise;
  function getDataSourceId() {
    dataSourceIdPromise ??= notion.databases
      .retrieve({ database_id: config.notionDatabaseId })
      .then((db) => db.data_sources[0].id);
    return dataSourceIdPromise;
  }

  return {
    async save(content, tags = []) {
      const page = await notion.pages.create({
        parent: { database_id: config.notionDatabaseId },
        properties: {
          [PROP.content]: { title: [{ text: { content } }] },
          [PROP.tags]: { multi_select: tags.map((name) => ({ name })) },
          [PROP.status]: { select: { name: "active" } },
        },
      });
      return toThought(page);
    },

    async listActive() {
      const dataSourceId = await getDataSourceId();
      const thoughts = [];
      let cursor;
      do {
        const res = await notion.dataSources.query({
          data_source_id: dataSourceId,
          filter: { property: PROP.status, select: { equals: "active" } },
          start_cursor: cursor,
        });
        thoughts.push(...res.results.map(toThought));
        cursor = res.has_more ? res.next_cursor : undefined;
      } while (cursor);
      return thoughts;
    },

    async setStatus(id, status) {
      await notion.pages.update({
        page_id: id,
        properties: { [PROP.status]: { select: { name: status } } },
      });
    },
  };
}
