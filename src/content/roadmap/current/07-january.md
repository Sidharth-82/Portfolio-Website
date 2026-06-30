---
label: January
sublabel: "2027"
order: 7
---

**Tier 2 · Integration — learned BEV segmentation.** Replace the classical warp
with a learned camera→BEV transform.

- Implement a simplified **Lift-Splat-Shoot**: predict a per-pixel depth
  distribution, "lift" image features into a 3-D frustum, "splat" them onto a BEV
  grid, then segment (road / lane / vehicle) directly in BEV. *Paper:*
  Lift-Splat-Shoot (Philion & Fidler) — read this one closely. *Dataset:*
  nuScenes-mini (it has the multi-camera rig you need).
- **Ablation:** compare directly against September's classical IPM output on the
  same scene — that side-by-side makes a great portfolio figure and shows *why*
  learned BEV wins (height info, non-planar roads, dynamic objects).
