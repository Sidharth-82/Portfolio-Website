import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from './Modal';

export interface TimelineEntry {
  id: string;
  /** stable deep-link slug, e.g. `year-1` or `january` (`/roadmap/#<slug>`) */
  slug: string;
  label: string;
  sublabel?: string;
  /** detailed description, pre-rendered to HTML at build time */
  html: string;
}

export interface EraData {
  id: string;
  title: string;
  subtitle: string;
  kind: 'years' | 'months';
  entries: TimelineEntry[];
}

interface Props {
  eras: EraData[];
}

/**
 * Interactive, zoomable learning roadmap with centered, circular nodes.
 *
 *  - Top level: a centered row of circular era nodes.
 *  - Click an era  -> "zoom" into centered, circular nodes (one per year/month).
 *  - Click a node  -> popup with that node's description.
 *
 * Fully data-driven from the `eras` prop — adding eras/nodes never touches code.
 */
export default function Timeline({ eras }: Props) {
  const [activeEraId, setActiveEraId] = useState<string | null>(null);
  const [entry, setEntry] = useState<TimelineEntry | null>(null);

  const activeEra = eras.find((e) => e.id === activeEraId) ?? null;
  // A connecting line reads as a "timeline" only for a single centered row.
  const showLine = (activeEra?.entries.length ?? 0) <= 6;

  // Deep-linking: `/roadmap/#<era>` zooms into an era; `/roadmap/#<node>` zooms
  // into the node's era and opens its popup. Re-checked on initial load, after
  // Astro view-transition navigations, and on manual hash changes.
  const syncFromHash = useCallback(() => {
    const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!slug) return;
    // Era-level deep link.
    const era = eras.find((e) => e.id === slug);
    if (era) {
      setActiveEraId(era.id);
      setEntry(null);
      return;
    }
    // Node-level deep link.
    for (const e of eras) {
      const match = e.entries.find((en) => en.slug === slug);
      if (match) {
        setActiveEraId(e.id);
        setEntry(match);
        return;
      }
    }
  }, [eras]);

  useEffect(() => {
    syncFromHash();
    document.addEventListener('astro:page-load', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      document.removeEventListener('astro:page-load', syncFromHash);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [syncFromHash]);

  // Keep the URL hash in sync so any view is shareable/deep-linkable. Passing
  // null drops the hash (preserving the base path + search).
  const setHash = (h: string | null) => {
    if (h) history.replaceState(null, '', `#${h}`);
    else if (window.location.hash)
      history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const openEra = (id: string) => {
    setActiveEraId(id);
    setEntry(null);
    setHash(id);
  };
  const closeEra = () => {
    setActiveEraId(null);
    setEntry(null);
    setHash(null);
  };
  const openEntry = (en: TimelineEntry) => {
    setEntry(en);
    setHash(en.slug);
  };
  // Closing a node returns to its era view, so revert the hash to the era id.
  const closeEntry = () => {
    setEntry(null);
    setHash(activeEraId);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-center">
      <AnimatePresence mode="wait">
        {!activeEra ? (
          /* ─────────────── Top level: the eras (circular) ─────────────── */
          <motion.div
            key="eras"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.3 }}
            className="relative py-6"
          >
            {/* connecting line behind the centered circles */}
            <div className="pointer-events-none absolute inset-x-8 top-1/2 hidden h-px -translate-y-1/2 bg-border md:block" />
            <div className="relative flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {eras.map((era, i) => (
                <motion.button
                  key={era.id}
                  onClick={() => openEra(era.id)}
                  className="group flex h-44 w-44 flex-col items-center justify-center rounded-full border border-border bg-surface px-5 text-center transition hover:border-accent hover:shadow-glow"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="mb-2 inline-flex h-2.5 w-2.5 rounded-full bg-accent shadow-glow" />
                  <span className="text-lg font-semibold leading-tight">{era.title}</span>
                  <span className="mt-1 text-xs text-muted">{era.subtitle}</span>
                  <span className="mt-2 text-xs font-medium text-accent">
                    {era.entries.length} {era.kind} · zoom in →
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ─────────────── Zoomed-in: one era's nodes (circular) ─────────────── */
          <motion.div
            key={activeEra.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold">{activeEra.title}</h3>
                <p className="text-sm text-muted">{activeEra.subtitle}</p>
              </div>
              <button onClick={closeEra} className="btn-ghost">
                ← All eras
              </button>
            </div>

            <div className="relative py-4">
              {showLine && (
                <div className="pointer-events-none absolute inset-x-8 top-1/2 hidden h-px -translate-y-1/2 bg-border md:block" />
              )}
              <div className="relative flex flex-wrap items-center justify-center gap-6">
                {activeEra.entries.map((en, i) => (
                  <motion.button
                    key={en.id}
                    onClick={() => openEntry(en)}
                    className="group flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-border bg-surface px-3 text-center transition hover:border-accent hover:bg-accent/10 hover:shadow-glow"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-sm font-semibold leading-tight">{en.label}</span>
                    {en.sublabel && (
                      <span className="mt-1 text-[10px] leading-tight text-muted">
                        {en.sublabel}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-muted">Click any node for details</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={!!entry} onClose={closeEntry} label={entry?.label}>
        {entry && (
          <article>
            <h2 className="text-2xl font-bold">{entry.label}</h2>
            {entry.sublabel && <p className="mt-1 text-sm text-muted">{entry.sublabel}</p>}
            <div className="rich-text mt-4" dangerouslySetInnerHTML={{ __html: entry.html }} />
          </article>
        )}
      </Modal>
    </div>
  );
}
