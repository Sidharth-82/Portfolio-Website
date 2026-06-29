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
 * The header is `transition:persist`ed across View-Transition navigations, so
 * this island is NOT re-rendered with a fresh `pathname` prop when you switch
 * tabs. We therefore track the live URL on the client and update on Astro's
 * navigation events — that's what keeps the active pill in sync.
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

  const base = import.meta.env.BASE_URL;
  const isActive = (href: string) =>
    href === base ? path === base : path === href || path.startsWith(href + '/');

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
