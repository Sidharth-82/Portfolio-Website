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
    image: z.string(), // path under /public, e.g. /images/projects/alpha.svg — may also be a video (.mp4/.webm/.mov)
    github: z.string().url().optional(), // hyperlink shown in the popup
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false), // surface on the Home page
    order: z.number().default(99), // lower = earlier
  }),
});

// One .md file per skill tile (curated showcase set). A skill's PROJECTS are
// derived automatically from the project `tags` that equal its `name` or any of
// its `aliases` (case-insensitive) — so counts stay in sync as projects change.
// The markdown body is optional "about this skill" prose shown in the popup.
const skills = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(), // display name, also matched against project tags
    level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
    category: z.string().default('General'), // groups + filters the tiles
    icon: z.string().optional(), // an emoji shown on the tile (e.g. "🐍")
    featured: z.boolean().default(false), // surface on the Home "Featured Skills" slide
    order: z.number().default(99), // lower = earlier; also breaks alias ties
    // Extra project tags that should count toward this skill (e.g. Computer
    // Vision ← [OpenCV, YOLOv8]). Keep aliases roughly unique; if a tag maps to
    // several skills, the lowest-`order` skill wins for the clickable chip.
    aliases: z.array(z.string()).default([]),
    // Courses / certifications. A course with `certificates` shows those images
    // (click to zoom) + a link; a course WITHOUT certificates renders as one
    // big clickable card linking to the course home. `link`/`summary` optional.
    courses: z
      .array(
        z.object({
          title: z.string(),
          provider: z.string().optional(), // e.g. "Coursera", "DeepLearning.AI"
          link: z.string().url().optional(), // course home page
          summary: z.string().default(''), // short blurb
          certificates: z.array(z.string()).default([]), // image paths under /public
        }),
      )
      .default([]),
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
  skills,
  roadmap,
  about: singleton,
  goals: singleton,
};
