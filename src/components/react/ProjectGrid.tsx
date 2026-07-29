import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProjectModal, { isVideo, StatusBadge } from './ProjectModal';
import type { ProjectData } from './ProjectModal';
import type { SkillData } from './SkillModal';
import { withBase } from '../../config/site';

// Re-exported so existing `import type { ProjectData } from './ProjectGrid'`
// call sites keep working; the type now lives with the popup that renders it.
export type { ProjectData } from './ProjectModal';

interface Props {
  projects: ProjectData[];
  /**
   * The in-progress project, rendered as a full-width banner above the grid.
   * Keep it OUT of `projects` so it doesn't also appear as an ordinary tile.
   */
  spotlight?: ProjectData | null;
  /** When true, the grid stretches to fill its parent's height (standalone page). */
  fill?: boolean;
  /**
   * When provided, project tags that match a skill become clickable and open
   * that skill's popup in place (same content as the Skills page).
   */
  skills?: SkillData[];
}

/**
 * Modular project tiles. Each tile opens a popup with the full description and
 * an optional GitHub link. Add a project by adding a markdown file — no code
 * change needed.
 */
export default function ProjectGrid({
  projects,
  spotlight = null,
  fill = false,
  skills = [],
}: Props) {
  const [active, setActive] = useState<ProjectData | null>(null);

  // Every project the popup can deep-link to, spotlight included.
  const all = spotlight ? [spotlight, ...projects] : projects;

  // Deep-linking: a link to `/projects#<slug>` (e.g. from a roadmap popup)
  // opens that project's popup directly. We re-check on initial load, after
  // Astro view-transition navigations, and on manual hash changes.
  const openFromHash = useCallback(() => {
    const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!slug) return;
    const match = all.find((p) => p.slug === slug);
    if (match) setActive(match);
  }, [projects, spotlight]);

  useEffect(() => {
    openFromHash();
    document.addEventListener('astro:page-load', openFromHash);
    window.addEventListener('hashchange', openFromHash);
    return () => {
      document.removeEventListener('astro:page-load', openFromHash);
      window.removeEventListener('hashchange', openFromHash);
    };
  }, [openFromHash]);

  // Open from a tile click: keep the URL shareable/deep-linkable.
  const open = (p: ProjectData) => {
    setActive(p);
    history.replaceState(null, '', `#${p.slug}`);
  };

  // Close: drop the hash so a refresh (or back nav) doesn't re-open the popup.
  const close = () => {
    setActive(null);
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  // A project mini-tile inside a skill popup was clicked: swap to that project's
  // popup in place (we're already on the projects page).
  const openProjectBySlug = (slug: string) => {
    const match = all.find((p) => p.slug === slug);
    if (match) open(match);
  };

  return (
    <>
      <div
        className={[
          'grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          fill ? 'min-h-0 flex-1' : '',
        ].join(' ')}
      >
        {/* In-progress project: one row tall, spanning every column. */}
        {spotlight && (
          <motion.button
            key={spotlight.slug}
            onClick={() => open(spotlight)}
            className="card group col-span-full flex min-h-[15rem] flex-col overflow-hidden text-left hover:border-accent hover:shadow-glow sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative aspect-[16/9] shrink-0 overflow-hidden sm:aspect-auto sm:w-2/5 lg:w-1/2">
              <SpotlightMedia project={spotlight} />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8">
              {spotlight.status && <StatusBadge status={spotlight.status} />}
              <h3 className="text-2xl font-bold sm:text-3xl">{spotlight.title}</h3>
              <p className="max-w-2xl text-muted">{spotlight.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {spotlight.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        )}

        {projects.map((p, i) => (
          <motion.button
            key={p.slug}
            onClick={() => open(p)}
            className="card group flex h-full flex-col overflow-hidden text-left hover:border-accent hover:shadow-glow"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative aspect-[16/9] shrink-0 overflow-hidden">
              {isVideo(p.image) ? (
                <video
                  src={withBase(p.image)}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={p.title}
                  onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                  className="h-full w-full bg-black object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <img
                  src={withBase(p.image)}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 pt-1 [&:not(:empty)]:mt-auto">
                {p.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <ProjectModal
        project={active}
        onClose={close}
        skills={skills}
        onOpenProject={openProjectBySlug}
      />
    </>
  );
}

/** Banner media: video autoplays on hover (like the tiles), image just scales. */
function SpotlightMedia({ project }: { project: ProjectData }) {
  return isVideo(project.image) ? (
    <video
      src={withBase(project.image)}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={project.title}
      onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
      onMouseLeave={(e) => {
        e.currentTarget.pause();
        e.currentTarget.currentTime = 0;
      }}
      className="h-full w-full bg-black object-cover transition duration-500 group-hover:scale-105"
    />
  ) : (
    <img
      src={withBase(project.image)}
      alt={project.title}
      loading="lazy"
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
    />
  );
}
