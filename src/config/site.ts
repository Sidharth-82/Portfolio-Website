/**
 * Site-wide identity & navigation config.
 * Edit this file to change your name, links, resume path, or the tab order.
 */

// Vite emits this as `/_astro/resume.<contenthash>.pdf`, so the URL changes
// whenever the PDF's bytes change. GitHub Pages serves static files with a
// 4-hour `Cache-Control` and gives us no way to override it, so a fixed
// `/resume.pdf` URL kept serving a stale copy long after deploy. A hashed
// URL can't go stale. Keep the PDF in `src/assets/`, not `public/`.
import resumeUrl from '../assets/resume.pdf?url';

export interface NavTab {
  href: string;
  label: string;
}

/**
 * Join the configured base path (`/Portfolio-Website` on GitHub Pages, `/`
 * locally) with an asset/route path. Astro's `BASE_URL` has no trailing slash,
 * so naive string concatenation breaks — this normalizes both sides.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export const site = {
  name: 'Sidharth Sreeram',
  role: 'Aspiring AI Systems Engineer',
  tagline: 'I build software that understands the world around me',
  email: 'sidharthsreeram@gmail.com',
  /** Content-hashed at build time — replace `src/assets/resume.pdf` to update. */
  resumePath: resumeUrl,
  /** Portrait shown in the Home "About me" slide. Replace this file. */
  portrait: withBase('/images/about/photo.jpeg'),
  socials: {
    github: 'https://github.com/Sidharth-82',
    linkedin: 'https://www.linkedin.com/in/sidharthsreeram/',
  },
};

/** The tabs shown in the top tab bar (Home is the immersive hub). */
export const navTabs: NavTab[] = [
  { href: withBase('/'), label: 'Home' },
  { href: withBase('/projects'), label: 'Projects' },
  { href: withBase('/skills'), label: 'Skills' },
  { href: withBase('/roadmap'), label: 'Roadmap' },
];
