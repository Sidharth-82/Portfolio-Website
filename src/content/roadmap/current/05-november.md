---
label: November
sublabel: "2026"
order: 5
---

**Tier 2 · Integration — 3-D object detection from LiDAR.** Start thinking in 3-D
and in BEV space, where modern perception actually lives.

- Train **PointPillars** or **CenterPoint** to predict 3-D boxes (center, size,
  yaw), combining voxelization from Tier 1 with anchor-free 3-D detection heads.
  *Papers:* PointPillars (Lang et al.), CenterPoint (Yin et al.); SECOND (Yan et
  al.) for background.
- **Dataset:** KITTI 3-D or nuScenes-mini.
- **Ablation:** voxel size vs. accuracy / latency — a real design trade-off every
  perception team faces.
