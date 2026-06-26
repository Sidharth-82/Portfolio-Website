import { useEffect, useState } from 'react';

export interface Slide {
  id: string;
  label: string;
}

interface Props {
  slides: Slide[];
  /** id of the scroll-snap container that holds the slides */
  containerId?: string;
}

/**
 * Right-edge dot navigation for the Home page's full-screen vertical slides.
 * Highlights the slide currently in view and scrolls to a slide on click.
 * Hidden on small screens.
 */
export default function SlideDots({ slides, containerId = 'home-scroll' }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = document.getElementById(containerId);
    const els = slides
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => e !== null);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = slides.findIndex((s) => s.id === (entry.target as HTMLElement).id);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { root: container, threshold: 0.5 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [slides, containerId]);

  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
      {slides.map((s, i) => (
        <button
          key={s.id}
          onClick={() => go(s.id)}
          aria-label={`Go to ${s.label}`}
          aria-current={i === active}
          className={[
            'h-3 w-3 rounded-full border transition-all duration-300',
            i === active
              ? 'scale-125 border-accent bg-accent shadow-glow'
              : 'border-muted/60 bg-transparent hover:border-accent',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
