---
label: April
sublabel: "2027"
order: 10
---

**Tier 3 · Capstone — Core perception modules.** Build and integrate the
single-frame perception components into one pipeline.

- **Focus:** combine detection, segmentation, and depth into a shared BEV
  representation.
- **Work:** wire the Tier 1 modules (detector, segmenter, depth) into a unified
  inference graph with consistent coordinate frames.
- **Deliverable:** an end-to-end single-frame perception module producing BEV
  detections + a semantic map, benchmarked against the March baseline.

<!-- TODO: confirm which modules make the capstone integration cut. -->
