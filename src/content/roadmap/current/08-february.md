---
label: February
sublabel: "2027"
order: 8
---

**Tier 2 · Integration — query-based multi-camera 3-D detection.** The
attention-based alternative to a dense BEV grid.

- Build a small-scale **DETR3D / PETR**-style detector: learned object queries
  attend directly into multi-view image features, with no explicit BEV grid. Uses
  transformer cross-attention + multi-view geometry on top of Tier 2's box
  parameterization. *Papers:* DETR3D (Wang et al.), PETR (Liu et al.). *Dataset:*
  nuScenes-mini (6-camera rig). Connects to the transformer/attention work in my
  [Llama-from-scratch](/projects/#llama-implementation) and
  [Qwen 3 VQA](/projects/#qwen3-vqa) projects.
- **Research angle:** understand *why* the field keeps both paradigms — dense BEV
  grids vs. sparse queries — and their compute / accuracy trade-offs.
