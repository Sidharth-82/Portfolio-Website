import { useMemo, useState } from 'react';
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
  /** the single in-progress project: banner on /projects + its own Home slide */
  spotlight?: boolean;
  /** badge text shown beside a spotlight project's title, e.g. "In Progress" */
  status?: string;
  /** detailed description, pre-rendered to HTML at build time */
  html: string;
}

/** A project's `image` may also point to a video file — detect it by extension. */
const VIDEO_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;
export const isVideo = (src: string) => VIDEO_RE.test(src.split(/[?#]/)[0]);

/** "In Progress" pill with a live pulse; shown wherever a spotlight is rendered. */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 self-start rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
      <span aria-hidden className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      {status}
    </span>
  );
}

interface Props {
  project: ProjectData | null;
  onClose: () => void;
  /**
   * Skills that make matching tags clickable (opens that skill's popup, layered
   * above this one). Omit to render tags as plain chips.
   */
  skills?: SkillData[];
  /**
   * How a project mini-tile inside the skill popup behaves. Provide on the
   * projects page (swap to that project in place); omit elsewhere so the tile
   * deep-links to /projects#slug instead.
   */
  onOpenProject?: (slug: string) => void;
}

/**
 * The project detail popup: hero media, clickable skill tags, the full
 * write-up, and an optional GitHub link. Shared by the project grid and the
 * Home page's spotlight slide so both open the identical popup.
 */
export default function ProjectModal({ project, onClose, skills = [], onOpenProject }: Props) {
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

  return (
    <>
      <Modal open={!!project} onClose={onClose} label={project?.title}>
        {project && (
          <article>
            {isVideo(project.image) ? (
              <video
                src={withBase(project.image)}
                controls
                playsInline
                className="mb-5 aspect-video w-full rounded-xl border border-border bg-black"
              />
            ) : (
              <button
                type="button"
                onClick={() => setZoom({ src: withBase(project.image), alt: project.title })}
                aria-label="View image fullscreen"
                className="group relative mb-5 block aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-xl"
              >
                <img
                  src={withBase(project.image)}
                  alt={project.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </button>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{project.title}</h2>
              {project.status && <StatusBadge status={project.status} />}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.tags.map((t) => {
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
              dangerouslySetInnerHTML={{ __html: project.html }}
            />
            {project.github?.trim() && (
              <a
                href={project.github}
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
        onOpenProject={
          onOpenProject &&
          ((slug) => {
            setActiveSkill(null);
            onOpenProject(slug);
          })
        }
      />

      <Lightbox src={zoom?.src ?? null} alt={zoom?.alt} onClose={() => setZoom(null)} />
    </>
  );
}
