import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import Lightbox from './Lightbox';
import SkillModal from './SkillModal';
import type { SkillData } from './SkillModal';
import { withBase } from '../../config/site';

export interface ProjectData {
  slug: string;
  title: string;
  summary: string;
  image: string;
  github?: string;
  tags: string[];
  /** detailed description, pre-rendered to HTML at build time */
  html: string;
}

interface Props {
  projects: ProjectData[];
  /** When true, the grid stretches to fill its parent's height (standalone page). */
  fill?: boolean;
  /**
   * When provided, project tags that match a skill become clickable and open
   * that skill's popup in place (same content as the Skills page).
   */
  skills?: SkillData[];
}

/** A project's `image` may also point to a video file — detect it by extension. */
const VIDEO_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;
const isVideo = (src: string) => VIDEO_RE.test(src.split(/[?#]/)[0]);

/**
 * Modular project tiles. Each tile opens a popup with the full description and
 * an optional GitHub link. Add a project by adding a markdown file — no code
 * change needed.
 */
export default function ProjectGrid({ projects, fill = false, skills = [] }: Props) {
  const [active, setActive] = useState<ProjectData | null>(null);
  // Fullscreen image viewer (hero image + any image in the description).
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  // Skill popup opened by clicking a tag in a project's description.
  const [activeSkill, setActiveSkill] = useState<SkillData | null>(null);

  // Lowercased tag/alias -> skill, so a project tag can open its skill popup.
  const tagSkill = useMemo(() => {
    const map = new Map<string, SkillData>();
    for (const s of skills) {
      for (const key of [s.name, ...s.aliases]) {
        const k = key.toLowerCase();
        if (!map.has(k)) map.set(k, s);
      }
    }
    return map;
  }, [skills]);

  // Open the lightbox when a description image is clicked (the HTML is injected
  // via dangerouslySetInnerHTML, so we delegate from the container).
  const onRichTextClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setZoom({ src: img.currentSrc || img.src, alt: img.alt });
    }
  };

  // Deep-linking: a link to `/projects#<slug>` (e.g. from a roadmap popup)
  // opens that project's popup directly. We re-check on initial load, after
  // Astro view-transition navigations, and on manual hash changes.
  const openFromHash = useCallback(() => {
    const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!slug) return;
    const match = projects.find((p) => p.slug === slug);
    if (match) setActive(match);
  }, [projects]);

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
  // popup in place (we're already on the projects page) and close the skill one.
  const openProjectBySlug = (slug: string) => {
    const match = projects.find((p) => p.slug === slug);
    if (match) {
      setActiveSkill(null);
      open(match);
    }
  };

  return (
    <>
      <div
        className={[
          'grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          fill ? 'min-h-0 flex-1' : '',
        ].join(' ')}
      >
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

      <Modal open={!!active} onClose={close} label={active?.title}>
        {active && (
          <article>
            {isVideo(active.image) ? (
              <video
                src={withBase(active.image)}
                controls
                playsInline
                className="mb-5 aspect-video w-full rounded-xl border border-border bg-black"
              />
            ) : (
              <button
                type="button"
                onClick={() => setZoom({ src: withBase(active.image), alt: active.title })}
                aria-label="View image fullscreen"
                className="group relative mb-5 block aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-xl"
              >
                <img
                  src={withBase(active.image)}
                  alt={active.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </button>
            )}
            <h2 className="text-2xl font-bold">{active.title}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {active.tags.map((t) => {
                const skill = tagSkill.get(t.toLowerCase());
                return skill ? (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveSkill(skill)}
                    title={`View ${skill.name} skill`}
                    className="chip cursor-pointer border-accent/40 text-accent transition hover:border-accent hover:bg-accent hover:text-white"
                  >
                    {t}
                  </button>
                ) : (
                  <span key={t} className="chip">
                    {t}
                  </span>
                );
              })}
            </div>
            <div
              className="rich-text mt-4"
              onClick={onRichTextClick}
              dangerouslySetInnerHTML={{ __html: active.html }}
            />
            {active.github?.trim() && (
              <a
                href={active.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent mt-6"
              >
                View on GitHub
                <span aria-hidden>↗</span>
              </a>
            )}
          </article>
        )}
      </Modal>

      {/* Skill popup opened by clicking a tag; layered above the project modal. */}
      <SkillModal
        skill={activeSkill}
        onClose={() => setActiveSkill(null)}
        onOpenProject={openProjectBySlug}
      />

      <Lightbox src={zoom?.src ?? null} alt={zoom?.alt} onClose={() => setZoom(null)} />
    </>
  );
}
