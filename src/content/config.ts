import { defineCollection, z } from 'astro:content';

/**
 * Content collections = typed, validated markdown.
 * Add a .md file to any folder below and it automatically shows up on the site.
 */

// One .md file per project tile.
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(), // short text shown on the tile
    image: z.string(), // path under /public, e.g. /images/projects/alpha.svg
    github: z.string().url().optional(), // hyperlink shown in the popup
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false), // surface on the Home page
    order: z.number().default(99), // lower = earlier
  }),
});

// One .md file per timeline node. Lives in subfolders that match the era's
// `collectionDir` (e.g. roadmap/undergraduate/year-1.md, roadmap/current/01-january.md).
const roadmap = defineCollection({
  type: 'content',
  schema: z.object({
    label: z.string(), // e.g. "Year 1" or "January"
    sublabel: z.string().optional(), // e.g. "2020 – 2021"
    order: z.number().default(0), // position within the era
  }),
});

// Single-document sections (about-me, future-goals).
const singleton = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
  }),
});

export const collections = {
  projects,
  roadmap,
  about: singleton,
  goals: singleton,
};
