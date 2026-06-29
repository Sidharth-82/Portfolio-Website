import { marked } from 'marked';
import { withBase } from '../config/site';

/**
 * Render markdown to HTML, rewriting root-relative links and images so they
 * respect the configured base path (`/Portfolio-Website` on GitHub Pages).
 *
 * Content authors write normal root-relative URLs (e.g. `/roadmap`,
 * `/images/foo.png`); this prefixes them with the base at build time. Absolute
 * (`http://…`), protocol-relative (`//…`), anchor (`#…`), and already-based URLs
 * are handled correctly — never hardcode the base inside markdown.
 */
export function renderMarkdown(md: string): string {
  const html = marked.parse(md) as string;
  // Match href="/…" or src="/…" but skip protocol-relative `//`.
  return html.replace(
    /\b(href|src)="\/(?!\/)([^"]*)"/g,
    (_m, attr, path) => `${attr}="${withBase('/' + path)}"`,
  );
}
