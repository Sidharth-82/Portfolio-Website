---
label: March
sublabel: "2027"
order: 9
---

**Tier 2 · Integration — temporal tracking & occupancy.** Add time in BEV and an
object-free scene representation; closes out Tier 2.

- **Temporal BEV tracking:** track objects *in BEV space* — a Kalman filter on
  3-D detections, or query-propagation where queries persist and update
  frame-to-frame instead of re-detecting from scratch. *References:* StreamPETR
  (Wang et al.); CenterTrack for a simpler joint detect-and-track baseline.
- **3-D semantic occupancy prediction:** predict per-voxel occupied/free + class
  around the ego vehicle — a very active direction that handles arbitrary and
  unknown shapes rather than fixed object boxes. *References:* SurroundOcc (Wei et
  al.), Occ3D. *Dataset:* Occ3D-nuScenes (low voxel resolution is fine for
  learning).
