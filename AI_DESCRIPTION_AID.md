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
  (5) **Featured Skills**, (6) "Where to next?" animated **portal cards** + the
  footer. The Home page passes `showFooter={false}` and renders its own footer
  inside the last slide.
- **Projects (`/projects`)** — modular tile grid; clicking a tile opens a popup
  with a detailed description + a GitHub hyperlink. In the popup, tags that
  correspond to a defined **skill** are clickable and open that skill's popup
  in place (`SkillModal`); clicking a project inside a skill popup swaps back to
  that project's popup.
- **Skills (`/skills`)** — searchable, category-filterable tile grid. Each tile
  shows the **level** (Beginner→Expert as a badge + 4-segment meter), **#
  projects**, and **# courses**. Clicking a tile opens a popup with the
  courses/certifications (certificate images zoom via `Lightbox`; a course with
  no certificate becomes a single click-through card) and the projects that use
  the skill (mini-tiles that deep-link to `/projects#<slug>`). A skill's projects
  are **derived from project `tags`** (name or `alias` match) — never hand-listed.
- **Learning Roadmap (`/roadmap`)** — interactive, **zoomable timeline** of
  "eras". Click an era to zoom into its nodes (years or months); click a node to
  open a popup. Designed to grow (add more eras over time).

Inner pages (Projects, Skills, Roadmap) show an **animated top tab bar**; the
Home page deliberately hides it in favor of the portal cards.

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
| Backend | **None** | Résumé is a build-hashed asset (`src/assets/resume.pdf`); everything else is static. |
| Page transitions | Astro **View Transitions** (`<ViewTransitions />`) | Smooth animated tab navigation with real, shareable URLs. |

---

## 3. File structure & navigation

```
portfolio/
├─ astro.config.mjs          # Astro + React + Tailwind; GitHub Pages base notes
├─ tailwind.config.mjs       # colors mapped to CSS variables (see global.css)
├─ tsconfig.json             # strict + react-jsx
├─ public/
│  ├─ favicon.svg
│  └─ images/
│     ├─ projects/*.svg      # placeholder tile images
│     └─ certificates/*      # ← skill certificate images (+ placeholder SVG)
└─ src/
   ├─ styles/global.css      # ★ THEME ACCENT COLORS live here (CSS vars)
   ├─ config/
   │  ├─ site.ts             # name, role, tagline, email, socials, resumePath, navTabs
   │  └─ roadmap.ts          # the list of timeline "eras" (modular; add here)
   ├─ lib/
   │  ├─ markdown.ts         # marked → HTML, base-path-aware (build time)
   │  └─ skills.ts           # loadSkills(): resolves skills ↔ projects at build
   ├─ content/
   │  ├─ config.ts           # Zod schemas for all collections
   │  ├─ projects/*.md       # one file per project tile
   │  ├─ skills/*.md         # one file per skill (level, category, courses, aliases)
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
   │     ├─ Lightbox.tsx        # fullscreen image viewer (layers above a modal)
   │     ├─ ProjectGrid.tsx     # tiles + project popup (tags open SkillModal)
   │     ├─ SkillModal.tsx      # shared skill popup + SkillData types + level badge/meter
   │     ├─ SkillsExplorer.tsx  # skills page search/filter/tiles (+ Home featured strip)
   │     ├─ Timeline.tsx        # zoomable roadmap, centered CIRCULAR nodes + popup
   │     ├─ HomeHub.tsx         # animated home portal cards
   │     ├─ SlideDots.tsx       # Home full-screen slide dot navigator (IntersectionObserver)
   │     ├─ TabBar.tsx          # animated top tab bar (uses navTabs)
   │     └─ ThemeToggle.tsx     # light/dark toggle
   └─ pages/
      ├─ index.astro          # Home hub (showTabBar={false})
      ├─ projects.astro
      ├─ skills.astro
      └─ roadmap.astro
```

### Data flow (important)
`.astro` pages load content collections at **build time**, convert each markdown
body to HTML with `marked`, and pass plain serializable objects to the React
islands as props. React never reads the filesystem; it just renders the data.

- Projects: `getCollection('projects')` → `ProjectData[]` → `<ProjectGrid>`.
- Skills: `loadSkills()` (`src/lib/skills.ts`) reads the `skills` + `projects`
  collections and returns `SkillData[]` — each skill's `projects` are the ones
  whose `tags` match its `name`/`aliases` (case-insensitive), so counts stay in
  sync automatically. Fed to `<SkillsExplorer>` (skills page + Home slide) and to
  `<ProjectGrid skills={…}>` (to make matching tags clickable). Image/certificate
  paths stay root-relative; the React components apply `withBase` (like projects).
  `buildTagSkillMap()` maps each tag → the skill it opens (lowest `order` wins).
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
  title, summary, image, github?, tags, featured, order). Auto-appears. Omit
  `github` to hide the "View on GitHub" button.
- **Images in a project popup** → the hero `image` and any markdown images in
  the description body (`![alt](/images/…)`) are **click-to-zoom fullscreen**
  (`Lightbox.tsx`, layered above the modal; Esc/click/✕ to close). Embedded
  images render full-width via the `.rich-text img` rule in `global.css`.
- **Video instead of an image** → if a project's `image` ends in a video
  extension (`.mp4/.webm/.ogg/.mov/.m4v`, see `isVideo` in `ProjectGrid.tsx`),
  the tile plays it muted on hover and the popup shows it with native controls
  (no lightbox — videos use their own fullscreen). Inside a description, embed
  video with raw `<video src="/videos/…" controls>` HTML (marked passes raw HTML
  through; root-relative `src` gets the base path; styled by `.rich-text video`).
- **New skill** → add `src/content/skills/<name>.md` (frontmatter: name, level,
  category, icon?, featured, order, aliases[], courses[]). Its **projects** are
  auto-derived from project `tags` matching `name`/`aliases` — don't list them.
  A course with `certificates: [/images/certificates/…]` shows the image(s)
  (click to zoom); omit them to render the course as one click-through link card.
  Set `featured: true` to surface it on the Home "Featured Skills" slide. Keep
  `aliases` roughly unique — if a tag maps to several skills, the lowest-`order`
  skill wins the clickable chip on the projects page.
- **New roadmap node** → add a `.md` to the era folder (label, sublabel?, order).
- **New roadmap era** → add an object to `eras` in `src/config/roadmap.ts` and
  create the matching `src/content/roadmap/<collectionDir>/` folder.
- **Identity / links / tab order** → `src/config/site.ts`.
- **Résumé** → overwrite `src/assets/resume.pdf`. It is imported with Vite's
  `?url` in `site.ts`, so the build emits `/_astro/resume.<contenthash>.pdf`.
  The hash changes with the bytes, which is what defeats the 4-hour
  `Cache-Control` GitHub Pages puts on static files. Do **not** move it back
  to `public/` — a fixed URL there serves a stale PDF for hours after deploy.

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

- Identity in `src/config/site.ts` is **real** (name, email, phone, socials);
  `role`/`tagline` are author-set copy — tweak to taste.
- **Projects** (`src/content/projects/*.md`) are **real** — 16 tiles drawn from
  the résumés/portfolio (UWB capstone, Qwen 3 VQA, Mars Rover, etc.). Each file
  has an `IMAGE NEEDED` HTML comment describing the real photo/diagram to drop
  in, and a few have `GITHUB:` notes where the repo URL is unconfirmed.
- **Undergraduate roadmap** (`roadmap/undergraduate/year-1..5.md`) is **real** —
  populated from the official transcript (courses, co-ops, standing) per year.
- **Future Plan roadmap** (`roadmap/current/*.md`) is a **DRAFT** three-tier
  CV/AI learning curriculum (Foundation → Integration → Capstone), spanning
  **July 2026 → June 2027** (note: month nodes order Jul-first via the `order`
  field; filenames keep their calendar-month names). Suggested papers/datasets
  are anchors with `TODO` comments — confirm/replace with the real reading list.
- About me & Future Goals prose are **author-written** (not lorem).
- Project tile images are still generated **labeled SVG placeholders**
  (`public/images/projects/*.svg`).
- **Skills** (`src/content/skills/*.md`) are a **SCAFFOLD**: 19 curated skills
  drawn from the real project tags, grouped into 4 categories, with best-guess
  `level`s and **placeholder courses** (each field marked `TODO`). Replace the
  course titles/providers/links/summaries and each skill's `level` with real
  data, and drop real certificate images into `public/images/certificates/`
  (a labeled placeholder SVG lives there now) — projects auto-derive from tags,
  so those need no editing.
