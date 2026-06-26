import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';

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
}

/**
 * Modular project tiles. Each tile opens a popup with the full description and
 * an optional GitHub link. Add a project by adding a markdown file — no code
 * change needed.
 */
export default function ProjectGrid({ projects }: Props) {
  const [active, setActive] = useState<ProjectData | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <motion.button
            key={p.slug}
            onClick={() => setActive(p)}
            className="card group overflow-hidden text-left hover:border-accent hover:shadow-glow"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
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

      <Modal open={!!active} onClose={() => setActive(null)} label={active?.title}>
        {active && (
          <article>
            <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-xl">
              <img src={active.image} alt={active.title} className="h-full w-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold">{active.title}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {active.tags.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
            <div className="rich-text mt-4" dangerouslySetInnerHTML={{ __html: active.html }} />
            {active.github && (
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
    </>
  );
}
