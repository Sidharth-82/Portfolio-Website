/**
 * Site-wide identity & navigation config.
 * Edit this file to change your name, links, resume path, or the tab order.
 */

export interface NavTab {
  href: string;
  label: string;
}

export const site = {
  name: 'Your Name',
  role: 'Aspiring Software Engineer',
  tagline: 'I build thoughtful software and I am always learning something new.',
  email: 'you@example.com',
  /** Static file served from /public. Drop your real resume at public/resume.pdf */
  resumePath: '/resume.pdf',
  /** Portrait shown in the Home "About me" slide. Replace this file. */
  portrait: '/images/about/portrait.svg',
  socials: {
    github: 'https://github.com/yourname',
    linkedin: 'https://www.linkedin.com/in/yourname',
  },
};

/** The tabs shown in the top tab bar (Home is the immersive hub). */
export const navTabs: NavTab[] = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/roadmap', label: 'Roadmap' },
];
