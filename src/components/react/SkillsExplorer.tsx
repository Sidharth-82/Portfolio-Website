import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SkillModal, { LevelBadge, LevelMeter } from './SkillModal';
import type { SkillData } from './SkillModal';

interface Props {
  skills: SkillData[];
  /** Show the search box + category filter pills (skills page). Off on Home. */
  showSearch?: boolean;
  /** Deep-link the open skill via `#slug`. Off on Home (its hash drives slides). */
  useHash?: boolean;
}

/**
 * The Skills explorer: a searchable, filterable grid of skill tiles that open a
 * shared SkillModal. Also powers the Home "Featured Skills" slide (pass only the
 * featured skills with showSearch/useHash off).
 */
export default function SkillsExplorer({ skills, showSearch = true, useHash = true }: Props) {
  const [active, setActive] = useState<SkillData | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const s of skills) if (!seen.includes(s.category)) seen.push(s.category);
    return ['All', ...seen];
  }, [skills]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
      if (category !== 'All' && s.category !== category) return false;
      if (!q) return true;
      return [s.name, s.category, ...s.aliases].join(' ').toLowerCase().includes(q);
    });
  }, [skills, query, category]);

  // Deep-linking: `/skills#<slug>` opens that skill directly (shareable).
  const openFromHash = useCallback(() => {
    if (!useHash) return;
    const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!slug) return;
    const match = skills.find((s) => s.slug === slug);
    if (match) setActive(match);
  }, [skills, useHash]);

  useEffect(() => {
    openFromHash();
    document.addEventListener('astro:page-load', openFromHash);
    window.addEventListener('hashchange', openFromHash);
    return () => {
      document.removeEventListener('astro:page-load', openFromHash);
      window.removeEventListener('hashchange', openFromHash);
    };
  }, [openFromHash]);

  const open = (s: SkillData) => {
    setActive(s);
    if (useHash) history.replaceState(null, '', `#${s.slug}`);
  };
  const close = () => {
    setActive(null);
    if (useHash && window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <>
      {showSearch && (
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills…"
              aria-label="Search skills"
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-content outline-none transition focus:border-accent focus:shadow-glow"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const activeCat = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={[
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                    activeCat
                      ? 'border-accent bg-accent text-white shadow-glow'
                      : 'border-border bg-surface text-muted hover:border-accent hover:text-accent',
                  ].join(' ')}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">No skills match “{query}”.</p>
      ) : (
        <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s, i) => (
            <motion.button
              key={s.slug}
              onClick={() => open(s)}
              className="card group flex h-full flex-col p-5 text-left hover:border-accent hover:shadow-glow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-2xl transition group-hover:border-accent"
                >
                  {s.icon ?? '⭐'}
                </span>
                <LevelBadge level={s.level} />
              </div>

              <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
              <p className="text-xs text-muted">{s.category}</p>

              <div className="mt-3">
                <LevelMeter level={s.level} />
              </div>

              <div className="mt-auto flex items-center gap-4 pt-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden>🛠️</span>
                  <span className="font-semibold text-content">{s.projects.length}</span>
                  {s.projects.length === 1 ? 'project' : 'projects'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden>🎓</span>
                  <span className="font-semibold text-content">{s.courses.length}</span>
                  {s.courses.length === 1 ? 'course' : 'courses'}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <SkillModal skill={active} onClose={close} />
    </>
  );
}
