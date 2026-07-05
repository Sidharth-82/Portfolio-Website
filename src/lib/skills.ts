import { getCollection } from 'astro:content';
import { renderMarkdown } from './markdown';
import type { SkillData } from '../components/react/SkillModal';

/**
 * Load the skills collection and resolve each skill's PROJECTS from the project
 * `tags` (matching the skill `name` or any `alias`, case-insensitive). Runs at
 * build time in .astro frontmatter; returns plain serializable objects for the
 * React islands. Image/certificate paths stay root-relative — the components
 * apply the base path via `withBase`, exactly like ProjectGrid does.
 */
export async function loadSkills(): Promise<SkillData[]> {
  const [skillEntries, projectEntries] = await Promise.all([
    getCollection('skills'),
    getCollection('projects'),
  ]);

  // Strip the numeric ordering prefix so deep-link slugs are stable/readable
  // and match `/projects#<slug>` (same convention as projects.astro).
  const projects = projectEntries
    .sort((a, b) => a.data.order - b.data.order)
    .map((p) => ({ slug: p.slug.replace(/^\d+-/, ''), ...p.data }));

  return skillEntries
    .sort((a, b) => a.data.order - b.data.order)
    .map((s) => {
      const names = [s.data.name, ...s.data.aliases].map((n) => n.toLowerCase());
      const matched = projects.filter((p) =>
        p.tags.some((t) => names.includes(t.toLowerCase())),
      );
      return {
        slug: s.slug.replace(/^\d+-/, ''),
        name: s.data.name,
        level: s.data.level,
        category: s.data.category,
        icon: s.data.icon,
        featured: s.data.featured,
        aliases: s.data.aliases,
        courses: s.data.courses,
        projects: matched.map((p) => ({
          slug: p.slug,
          title: p.title,
          image: p.image,
          summary: p.summary,
        })),
        html: renderMarkdown(s.body),
      } satisfies SkillData;
    });
}

/**
 * Map every project tag (lowercased) to the skill it opens, so the projects
 * page can make a tag chip clickable. If a tag maps to several skills, the
 * lowest-`order` skill wins (skills arrive here pre-sorted by order).
 */
export function buildTagSkillMap(skills: SkillData[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const skill of skills) {
    for (const key of [skill.name, ...skill.aliases]) {
      const k = key.toLowerCase();
      if (!(k in map)) map[k] = skill.slug;
    }
  }
  return map;
}
