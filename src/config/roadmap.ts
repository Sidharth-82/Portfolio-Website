/**
 * Learning-roadmap "eras" config.
 *
 * Each era is one zoomable section on the timeline. The prose for each node
 * lives in markdown files under src/content/roadmap/<collectionDir>/, so adding
 * a new era is a two-step, fully-modular operation:
 *
 *   1. Add an entry to the `eras` array below (title, subtitle, kind, dir).
 *   2. Create a folder src/content/roadmap/<collectionDir>/ and drop one .md
 *      file per node (year or month) into it.
 *
 *   kind: 'years'  -> the zoomed view shows one node per year file
 *   kind: 'months' -> the zoomed view shows one node per month file
 *   kind: 'projects' -> the zoomed view shows one node per project file
 */

export type EraKind = 'years' | 'months' | 'projects';

export interface Era {
  /** stable id, used in UI state */
  id: string;
  title: string;
  subtitle: string;
  kind: EraKind;
  /** folder name under src/content/roadmap/ holding this era's node files */
  collectionDir: string;
  /** left-to-right position on the top-level timeline */
  order: number;
}

export const eras: Era[] = [
  {
    id: 'undergraduate',
    title: 'Undergraduate',
    subtitle: 'Sept 2021 – June 2026',
    kind: 'years',
    collectionDir: 'undergraduate',
    order: 1,
  },
  {
    // Replaced the 12-month "Future Plan" era (2026-10-07). One node per project
    // currently in progress — update the files in roadmap/now/ as they change.
    id: 'now',
    title: "What I'm Up To Now",
    subtitle: 'October 2026',
    kind: 'projects',
    collectionDir: 'now',
    order: 2,
  },
  // 👉 Add future eras here as life goes on, e.g.:
  // { id: 'masters', title: "Master's", subtitle: '2027 – 2029', kind: 'years', collectionDir: 'masters', order: 3 },
];
