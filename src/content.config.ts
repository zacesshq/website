import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// the documentation pages scripts/sync-docs.mjs writes from the manifest; each carries where it
// came from so the page can say which release it describes and link to the file on GitHub
const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(1),
    section: z.enum(["install", "use", "extend", "contribute", "reference"]),
    group: z.enum(["reader", "scenes", "games", "themes", "profile"]).optional(),
    order: z.number().int(),
    product: z.string(),
    source: z.string(),
    repo: z.string(),
    ref: z.string(),
    refLabel: z.string(),
    release: z.string().optional(),
    path: z.string(),
    heading: z.string().optional(),
    sourceUrl: z.string().startsWith("https://github.com/"),
  }),
});

export const collections = { docs };
