# Portfolio Website

A fast, modular, content-driven personal portfolio built with **Astro + React
islands + Tailwind CSS** and authored entirely in **TypeScript + Markdown**.
No backend required — it's a fully static site (the résumé is a static file).

## Quick start

```bash
npm install      # install dependencies
npm run dev      # local dev server at http://localhost:4321
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

## How to edit content (no code required)

| I want to…                       | Do this                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| Add a **project**                | Add a `.md` file to `src/content/projects/` (copy an existing one).     |
| Mark a project as **featured**   | Set `featured: true` in its frontmatter (shows on the Home page).       |
| Edit **About me**                | Edit `src/content/about/about-me.md`.                                    |
| Edit **Future goals**            | Edit `src/content/goals/future-goals.md`.                                |
| Add a roadmap **node** (yr/month)| Add a `.md` file to the era folder under `src/content/roadmap/<era>/`.   |
| Add a roadmap **era**            | Add an entry in `src/config/roadmap.ts` + a matching folder (see below). |
| Change your **name / links**     | Edit `src/config/site.ts`.                                               |
| Change **accent colors / theme** | Edit the CSS variables at the top of `src/styles/global.css`.            |
| Replace the **résumé**           | Drop your PDF at `public/resume.pdf` (keep the filename).               |
| Replace a project **image**      | Drop a file in `public/images/projects/` and point `image:` at it.      |

### Project frontmatter

```yaml
---
title: Project Name
summary: One-line description shown on the tile.
image: /images/projects/your-image.svg
github: https://github.com/you/repo   # optional — shown in the popup
tags: [TypeScript, React]
featured: true                         # show on the Home page
order: 1                               # lower = earlier
---

Full markdown description shown in the popup…
```

### Adding a new roadmap era (it grows over time)

1. Add an era to `src/config/roadmap.ts`:
   ```ts
   { id: 'masters', title: "Master's", subtitle: '2027 – 2029',
     kind: 'years', collectionDir: 'masters', order: 3 }
   ```
2. Create `src/content/roadmap/masters/` and add one `.md` per node:
   ```yaml
   ---
   label: Year 1
   sublabel: "2027 – 2028"
   order: 1
   ---
   What happened / what's planned…
   ```

`kind: 'years'` or `kind: 'months'` just controls the label wording in the UI;
both render the same zoomable node track.

## Theming

All colors live as CSS variables in **`src/styles/global.css`**:

- **Light mode:** purple (`--color-accent`) + black (`--color-accent-2`)
- **Dark mode:** orange (`--color-accent`) + blue (`--color-accent-2`)

Change those few numbers to re-theme the entire site. A light/dark toggle is in
the header (defaults to the visitor's OS setting).

## Deployment

It's a static site (`npm run build` → `./dist`), deployable anywhere:

- **Netlify / Vercel:** point at the repo; build `npm run build`, output `dist`.
- **GitHub Pages:** uncomment and set `site` + `base` in `astro.config.mjs` to
  your repo path, then publish `dist` (e.g. via a Pages action).

See `AI_DESCRIPTION_AID.md` for the full architecture and rationale.
