/**
 * Site-wide identity & navigation config.
 * Edit this file to change your name, links, resume path, or the tab order.
 */

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
  tagline: 'I build software to understand the world around.',
  email: 'sidharthsreeram@gmail.com',
  /** Static file served from /public. Drop your real resume at public/resume.pdf */
  resumePath: withBase('/resume.pdf'),
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
  { href: withBase('/roadmap'), label: 'Roadmap' },
];
