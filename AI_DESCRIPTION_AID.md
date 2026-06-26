# AI Assistant Description File

IMPORTANT: IF AN AI ASSISTANT IS READING/EDITING THE CODEBASE, PLEASE KEEP THIS
FILE UP TO DATE — it describes the architecture, file structure, and the
decisions behind them so future prompts have full context.

---

## 1. What this is

A personal **portfolio website**. It is **fully static** (no backend / no Python)
and content-driven: all copy lives in Markdown files, so adding a project or a
timeline entry never requires touching code.

### Pages / sections
- **Home (`/`)** — immersive **full-screen vertical slide deck** with **no top
  tab bar**. CSS scroll-snap makes each section its own viewport-height slide;
  a right-edge **dot navigator** (`SlideDots.tsx`) tracks/jumps between slides.
  The five slides are: (1) Hero + résumé download, (2) **About me with a
  portrait image** (`site.portrait`), (3) Future Goals, (4) Featured Projects,
  (5) "Where to next?" animated **portal cards** + the footer. The Home page
  passes `showFooter={false}` and renders its own footer inside the last slide.
- **Projects (`/projects`)** — modular tile grid; clicking a tile opens a popup
  with a detailed description + a GitHub hyperlink.
- **Learning Roadmap (`/roadmap`)** — interactive, **zoomable timeline** of
  "eras". Click an era to zoom into its nodes (years or months); click a node to
  open a popup. Designed to grow (add more eras over time).

Inner pages (Projects, Roadmap) show an **animated top tab bar**; the Home page
deliberately hides it in favor of the portal cards.

---

## 2. Tech stack & key decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Framework | **Astro 4** | Static-first, ships ~zero JS except interactive islands; native typed Markdown content collections. |
| Interactivity | **React islands** (`.tsx`, `client:load`) | Only the interactive bits (modals, timeline, tabs, theme toggle) hydrate. |
| Language | **TypeScript** everywhere | Type-safe content schemas + components. |
| Styling | **Tailwind CSS v3** (`darkMode: 'class'`) | Fast iteration; theme via CSS variables. |
| Animation | **framer-motion** | Page-portal, timeline zoom, modal, tab-pill animations. |
| Markdown → HTML | **marked**, run at **build time** in `.astro` frontmatter | Detailed descriptions render to HTML strings passed to React; no client-side markdown lib shipped. |
| Backend | **None** | Résumé is a static `public/resume.pdf`; everything else is static. |
| Page transitions | Astro **View Transitions** (`<ViewTransitions />`) | Smooth animated tab navigation with real, shareable URLs. |

---

## 3. File structure & navigation

```
portfolio/
├─ astro.config.mjs          # Astro + React + Tailwind; GitHub Pages base notes
├─ tailwind.config.mjs       # colors mapped to CSS variables (see global.css)
├─ tsconfig.json             # strict + react-jsx
├─ public/
│  ├─ resume.pdf             # ← static résumé download (replace this)
│  ├─ favicon.svg
│  └─ images/projects/*.svg  # placeholder tile images
└─ src/
   ├─ styles/global.css      # ★ THEME ACCENT COLORS live here (CSS vars)
   ├─ config/
   │  ├─ site.ts             # name, role, tagline, email, socials, resumePath, navTabs
   │  └─ roadmap.ts          # the list of timeline "eras" (modular; add here)
   ├─ content/
   │  ├─ config.ts           # Zod schemas for all collections
   │  ├─ projects/*.md       # one file per project tile
   │  ├─ about/about-me.md   # About-me prose
   │  ├─ goals/future-goals.md
   │  └─ roadmap/
   │     ├─ undergraduate/year-1..5.md   # era node files (years)
   │     └─ current/01-january..12-december.md  # era node files (months)
   ├─ layouts/BaseLayout.astro  # <head>, theme bootstrap script, tab bar / footer
   ├─ components/
   │  ├─ astro/Footer.astro
   │  └─ react/                 # interactive islands
   │     ├─ Modal.tsx           # shared animated/accessible modal
   │     ├─ ProjectGrid.tsx     # tiles + project popup
   │     ├─ Timeline.tsx        # zoomable roadmap, centered CIRCULAR nodes + popup
   │     ├─ HomeHub.tsx         # animated home portal cards
   │     ├─ SlideDots.tsx       # Home full-screen slide dot navigator (IntersectionObserver)
   │     ├─ TabBar.tsx          # animated top tab bar (uses navTabs)
   │     └─ ThemeToggle.tsx     # light/dark toggle
   └─ pages/
      ├─ index.astro          # Home hub (showTabBar={false})
      ├─ projects.astro
      └─ roadmap.astro
```

### Data flow (important)
`.astro` pages load content collections at **build time**, convert each markdown
body to HTML with `marked`, and pass plain serializable objects to the React
islands as props. React never reads the filesystem; it just renders the data.

- Projects: `getCollection('projects')` → `ProjectData[]` → `<ProjectGrid>`.
- Roadmap: `getCollection('roadmap')` is split into eras by **folder name**
  (`node.id.split('/')[0]` matches `era.collectionDir` in `src/config/roadmap.ts`).
  So a node's era is derived from its folder — just drop a file in to add one.

### Gotcha: the active tab highlight
The header is `transition:persist`ed across View-Transition navigations (for a
smooth sliding pill), which means `TabBar` is NOT re-rendered with a fresh
`pathname` prop on navigation. `TabBar.tsx` therefore tracks the live URL on the
client via the `astro:page-load` / `astro:after-swap` events. If you remove that
listener, the active tab will appear stuck on the first-loaded page.

---

## 4. Theming (accent colors are easy to change — by request)

All colors are CSS variables defined ONCE in **`src/styles/global.css`**, and
Tailwind reads them via `rgb(var(--color-x) / <alpha-value>)` (see
`tailwind.config.mjs`). To re-theme the whole site, edit only these:

- **Light mode** (`:root`): `--color-accent` = **purple**, `--color-accent-2` = **black**
- **Dark mode** (`html.dark`): `--color-accent` = **orange**, `--color-accent-2` = **blue**

Neutral surfaces (bg/surface/border/text/muted) are also variables there. The
theme is applied before paint by an inline script in `BaseLayout.astro` (no flash)
and toggled by `ThemeToggle.tsx`; default follows the visitor's OS setting.

---

## 5. How to extend (modularity summary)

- **New project** → add `src/content/projects/<name>.md` (frontmatter:
  title, summary, image, github?, tags, featured, order). Auto-appears.
- **New roadmap node** → add a `.md` to the era folder (label, sublabel?, order).
- **New roadmap era** → add an object to `eras` in `src/config/roadmap.ts` and
  create the matching `src/content/roadmap/<collectionDir>/` folder.
- **Identity / links / tab order** → `src/config/site.ts`.
- **Résumé** → replace `public/resume.pdf` (keep the filename, or update
  `resumePath` in `site.ts`).

See `README.md` for the user-facing version of these instructions.

---

## 6. Build / run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> ./dist (static)
npm run preview
```

Verified: `npm run build` succeeds and emits 3 pages + hydrated islands to
`./dist`. Deployable to any static host (Netlify/Vercel/GitHub Pages — base-path
notes are in `astro.config.mjs`).

---

## 7. Placeholder content status (replace before going live)

- Name/role/links are placeholders in `src/config/site.ts`.
- All project copy, About me, Future Goals, and every roadmap node are **lorem
  ipsum / scrap data**.
- Project tile images are generated **SVG placeholders**; `resume.pdf` is a
  generated **placeholder PDF**.
