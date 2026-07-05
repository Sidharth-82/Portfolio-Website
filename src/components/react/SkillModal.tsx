import { useState } from 'react';
import Modal from './Modal';
import Lightbox from './Lightbox';
import { withBase } from '../../config/site';

/* ── Types (shared across the skills page, Home slide, and projects page) ── */

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillCourse {
  title: string;
  provider?: string;
  link?: string;
  summary: string;
  /** image paths under /public; empty => the whole card links to `link` */
  certificates: string[];
}

/** A project that uses this skill (derived from project tags at build time). */
export interface SkillProjectRef {
  slug: string;
  title: string;
  image: string;
  summary: string;
}

export interface SkillData {
  slug: string;
  name: string;
  level: SkillLevel;
  category: string;
  icon?: string;
  featured: boolean;
  aliases: string[];
  courses: SkillCourse[];
  projects: SkillProjectRef[];
  /** optional "about this skill" prose, pre-rendered to HTML at build time */
  html: string;
}

/* ── Small shared bits (also reused by the tiles) ── */

export const LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const LEVEL_BADGE: Record<SkillLevel, string> = {
  Beginner: 'border-border bg-surface-2 text-muted',
  Intermediate: 'border-accent-2/40 bg-accent-2/10 text-accent-2',
  Advanced: 'border-accent/40 bg-accent/10 text-accent',
  Expert: 'border-transparent bg-gradient-to-r from-accent to-accent-2 text-white',
};

export function LevelBadge({ level }: { level: SkillLevel }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        LEVEL_BADGE[level],
      ].join(' ')}
    >
      {level}
    </span>
  );
}

/** Four-segment proficiency meter; fills up to the skill's level. */
export function LevelMeter({ level }: { level: SkillLevel }) {
  const filled = LEVELS.indexOf(level) + 1;
  return (
    <span className="flex items-center gap-1" aria-label={`Proficiency: ${level}`}>
      {LEVELS.map((_, i) => (
        <span
          key={i}
          className={[
            'h-1.5 w-6 rounded-full transition-colors',
            i < filled ? 'bg-accent' : 'bg-border',
          ].join(' ')}
        />
      ))}
    </span>
  );
}

const VIDEO_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;
const isVideo = (src: string) => VIDEO_RE.test(src.split(/[?#]/)[0]);

interface Props {
  skill: SkillData | null;
  onClose: () => void;
  /**
   * How a project mini-tile behaves. Provided on the projects page (open that
   * project's popup in place); omitted elsewhere (deep-link to /projects#slug).
   */
  onOpenProject?: (slug: string) => void;
}

/**
 * The skill detail popup: proficiency, optional blurb, courses/certifications,
 * and the projects that use the skill. Reused everywhere a skill is clicked.
 */
export default function SkillModal({ skill, onClose, onOpenProject }: Props) {
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const projectsHref = (slug: string) => `${withBase('/projects')}#${slug}`;

  return (
    <>
      <Modal open={!!skill} onClose={onClose} label={skill?.name}>
        {skill && (
          <article>
            {/* Header */}
            <div className="flex items-start gap-4">
              {skill.icon && (
                <span
                  aria-hidden
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border bg-surface-2 text-3xl"
                >
                  {skill.icon}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-2xl font-bold leading-tight">{skill.name}</h2>
                <p className="mt-0.5 text-sm text-muted">{skill.category}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <LevelBadge level={skill.level} />
                  <LevelMeter level={skill.level} />
                </div>
              </div>
            </div>

            {/* Optional intro blurb */}
            {skill.html.trim() && (
              <div
                className="rich-text mt-4 border-t border-border pt-4"
                dangerouslySetInnerHTML={{ __html: skill.html }}
              />
            )}

            {/* Courses & certifications */}
            {skill.courses.length > 0 && (
              <section className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
                  <span aria-hidden>🎓</span> Courses &amp; Certifications
                  <span className="text-muted/70">({skill.courses.length})</span>
                </h3>
                <div className="mt-3 space-y-4">
                  {skill.courses.map((course, i) => (
                    <CourseCard key={i} course={course} onZoom={setZoom} />
                  ))}
                </div>
              </section>
            )}

            {/* Projects that use this skill */}
            {skill.projects.length > 0 && (
              <section className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
                  <span aria-hidden>🛠️</span> Projects using {skill.name}
                  <span className="text-muted/70">({skill.projects.length})</span>
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {skill.projects.map((p) => {
                    const inner = (
                      <>
                        <div className="relative aspect-[16/9] shrink-0 overflow-hidden">
                          {isVideo(p.image) ? (
                            <video
                              src={withBase(p.image)}
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              className="h-full w-full bg-black object-cover"
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
                        <div className="p-3">
                          <h4 className="text-sm font-semibold">{p.title}</h4>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.summary}</p>
                        </div>
                      </>
                    );
                    const cls =
                      'card group flex flex-col overflow-hidden text-left transition hover:border-accent hover:shadow-glow';
                    return onOpenProject ? (
                      <button key={p.slug} type="button" onClick={() => onOpenProject(p.slug)} className={cls}>
                        {inner}
                      </button>
                    ) : (
                      <a key={p.slug} href={projectsHref(p.slug)} className={cls}>
                        {inner}
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {skill.courses.length === 0 && skill.projects.length === 0 && (
              <p className="mt-6 text-sm text-muted">Details coming soon.</p>
            )}
          </article>
        )}
      </Modal>

      {/* Certificate zoom, layered above the skill modal */}
      <Lightbox src={zoom?.src ?? null} alt={zoom?.alt} onClose={() => setZoom(null)} />
    </>
  );
}

/* ── One course row: a certificate gallery + link, or a big link card ── */
function CourseCard({
  course,
  onZoom,
}: {
  course: SkillCourse;
  onZoom: (z: { src: string; alt: string }) => void;
}) {
  const hasCerts = course.certificates.length > 0;

  const meta = (
    <>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-semibold">{course.title}</span>
        {course.provider && <span className="text-xs text-muted">· {course.provider}</span>}
      </div>
      {course.summary && <p className="mt-1 text-sm text-muted">{course.summary}</p>}
    </>
  );

  // No certificate: the whole card is a click-through link to the course home.
  if (!hasCerts) {
    if (course.link) {
      return (
        <a
          href={course.link}
          target="_blank"
          rel="noopener noreferrer"
          className="card group block p-4 transition hover:border-accent hover:shadow-glow"
        >
          {meta}
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
            Go to course <span aria-hidden>↗</span>
          </span>
        </a>
      );
    }
    return <div className="card p-4">{meta}</div>;
  }

  // Has certificate(s): show the image gallery (click to zoom) + course link.
  return (
    <div className="card p-4">
      {meta}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {course.certificates.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onZoom({ src: withBase(src), alt: `${course.title} certificate` })}
            aria-label="View certificate fullscreen"
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-lg border border-border bg-surface-2"
          >
            <img
              src={withBase(src)}
              alt={`${course.title} certificate ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      {course.link && (
        <a
          href={course.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:brightness-110"
        >
          Go to course <span aria-hidden>↗</span>
        </a>
      )}
    </div>
  );
}
