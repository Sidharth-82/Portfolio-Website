/**
 * Site-wide identity & navigation config.
 * Edit this file to change your name, links, resume path, or the tab order.
 */

export interface NavTab {
  href: string;
  label: string;
}

export const site = {
  name: 'Sidharth Sreeram',
  role: 'Aspiring Perception System Engineer',
  tagline: 'I build software to understand the world around.',
  email: 'sidharthsreeram@gmail.com',
  /** Replace with your real number. Used for the hero "Call" button (tel: link). */
  phone: '+1 (416) 564-8590',
  /** Static file served from /public. Drop your real resume at public/resume.pdf */
  resumePath: `${import.meta.env.BASE_URL}resume.pdf`,
  /** Portrait shown in the Home "About me" slide. Replace this file. */
  portrait: `${import.meta.env.BASE_URL}images/about/photo.jpeg`,
  socials: {
    github: 'https://github.com/Sidharth-82',
    linkedin: 'https://www.linkedin.com/in/sidharthsreeram/',
  },
};

/** The tabs shown in the top tab bar (Home is the immersive hub). */
export const navTabs: NavTab[] = [
  { href: import.meta.env.BASE_URL, label: 'Home' },
  { href: `${import.meta.env.BASE_URL}projects`, label: 'Projects' },
  { href: `${import.meta.env.BASE_URL}roadmap`, label: 'Roadmap' },
];
