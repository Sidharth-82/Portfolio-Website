import { useEffect, useState } from 'react';

/**
 * Light/dark toggle. The initial theme is applied by an inline script in
 * BaseLayout (before paint, to avoid a flash); this button just flips it and
 * persists the choice to localStorage.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark theme"
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-content transition hover:border-accent hover:text-accent"
    >
      <span aria-hidden>{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
