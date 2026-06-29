import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { navTabs } from '../../config/site';

interface Props {
  /** current path at first render (from the Astro page) */
  pathname: string;
}

/**
 * Animated top tab bar shown on every page except the Home hub.
 *
 * The active tab is computed server-side from `pathname`, so the highlight is
 * correct on first paint and after every View-Transition swap (the header is
 * NOT persisted, so it re-renders fresh each navigation). We also re-sync from
 * the live URL on Astro's navigation events as a belt-and-suspenders safeguard.
 */
export default function TabBar({ pathname }: Props) {
  const [path, setPath] = useState(pathname);

  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    update();
    document.addEventListener('astro:page-load', update);
    document.addEventListener('astro:after-swap', update);
    return () => {
      document.removeEventListener('astro:page-load', update);
      document.removeEventListener('astro:after-swap', update);
    };
  }, []);

  // Normalize trailing slashes so `/Portfolio-Website/` and `/Portfolio-Website`
  // (or `/projects` and `/projects/`) compare equal across dev/Pages.
  const norm = (s: string) => s.replace(/\/+$/, '') || '/';
  const home = norm(import.meta.env.BASE_URL);
  const isActive = (href: string) => {
    const h = norm(href);
    const p = norm(path);
    return h === home ? p === home : p === h || p.startsWith(h + '/');
  };

  return (
    <nav className="flex items-center gap-1 rounded-full border border-border bg-surface/80 p-1 backdrop-blur">
      {navTabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={[
              'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              active ? 'text-white' : 'text-muted hover:text-content',
            ].join(' ')}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 -z-0 rounded-full bg-accent"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
