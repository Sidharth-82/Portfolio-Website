import { useState } from 'react';
import { motion } from 'framer-motion';
import ProjectModal, { isVideo, StatusBadge } from './ProjectModal';
import type { ProjectData } from './ProjectModal';
import type { SkillData } from './SkillModal';
import { withBase } from '../../config/site';

interface Props {
  project: ProjectData;
  /** Tags matching a skill become clickable inside the popup. */
  skills?: SkillData[];
}

/**
 * The Home page's in-progress project slide: a full-width showcase of whatever
 * project sets `spotlight: true`. Media on one side, pitch on the other; both
 * open the same popup the projects page uses.
 */
export default function SpotlightProject({ project, skills = [] }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="grid w-full items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* ── Media ── */}
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${project.title}`}
          className="group relative block w-full overflow-hidden rounded-3xl border border-border bg-black shadow-glow"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-accent/20 blur-2xl" />
          {isVideo(project.image) ? (
            <video
              src={withBase(project.image)}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-label={project.title}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <img
              src={withBase(project.image)}
              alt={project.title}
              className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
            />
          )}
        </motion.button>

        {/* ── Pitch ── */}
        <motion.div
          className="flex flex-col items-start gap-4 text-left"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          {project.status && <StatusBadge status={project.status} />}
          <h2 className="text-3xl font-bold sm:text-4xl">{project.title}</h2>
          <p className="text-lg text-muted">{project.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="btn-accent">
              Read the write-up <span aria-hidden>→</span>
            </button>
            {project.github?.trim() && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                GitHub <span aria-hidden>↗</span>
              </a>
            )}
          </div>
        </motion.div>
      </div>

      <ProjectModal project={open ? project : null} onClose={() => setOpen(false)} skills={skills} />
    </>
  );
}
