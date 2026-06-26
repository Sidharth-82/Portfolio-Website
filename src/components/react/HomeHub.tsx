import { motion } from 'framer-motion';

export interface Portal {
  href: string;
  title: string;
  description: string;
  /** which accent drives the glow: 'accent' (primary) or 'accent-2' (secondary) */
  accent?: 'accent' | 'accent-2';
  icon?: string;
}

interface Props {
  portals: Portal[];
}

/**
 * The Home page's captivating navigation: large animated "portal" cards that
 * transport the visitor into each section. Replaces a top tab bar on Home.
 */
export default function HomeHub({ portals }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {portals.map((p, i) => {
        const isSecondary = p.accent === 'accent-2';
        return (
          <motion.a
            key={p.href}
            href={p.href}
            className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, type: 'spring', stiffness: 120, damping: 18 }}
            whileHover={{ y: -6, scale: 1.015 }}
          >
            {/* animated glow blob */}
            <div
              className={[
                'pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl transition-opacity duration-500',
                'opacity-30 group-hover:opacity-70',
                isSecondary ? 'bg-accent-2' : 'bg-accent',
              ].join(' ')}
            />
            <div className="relative z-10">
              {p.icon && <div className="mb-4 text-4xl">{p.icon}</div>}
              <h3 className="text-2xl font-bold sm:text-3xl">{p.title}</h3>
              <p className="mt-2 max-w-sm text-muted">{p.description}</p>
              <span
                className={[
                  'mt-6 inline-flex items-center gap-2 font-semibold transition-transform group-hover:translate-x-1',
                  isSecondary ? 'text-accent-2' : 'text-accent',
                ].join(' ')}
              >
                Explore <span aria-hidden>→</span>
              </span>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
