---
label: July
sublabel: "2026"
order: 1
---

<!--
PERCEPTION ROADMAP (Jul 2026 → Jun 2027). A 3-tier, project-based plan; every
project is a mini paper-reproduction: build a simplified version, run one
ablation, write a short results-style README. Compute stays light — nuScenes-mini,
a KITTI subset, or Colab/Kaggle cover Tier 1–2; full datasets are saved for the
capstone.
  • Tier 1 — Foundations  (Jul–Oct 2026): one primitive at a time
  • Tier 2 — Integration  (Nov 2026 – Mar 2027): combine primitives, think in BEV
  • Tier 3 — Capstone     (Apr–Jun 2027): a unified multi-task perception stack
-->

**Tier 1 · Foundations — detection & depth.** Get the core perception primitives
solid before combining them. Driving datasets are just a rich, convenient
testbed — the skills are general computer vision.

- **2D object detector + custom head:** fine-tune YOLOv8 / Faster R-CNN, then rip
  out the head and reimplement it (anchor-based vs. anchor-free) on the pretrained
  backbone. *Papers:* Faster R-CNN (Ren et al.), FCOS. *Ablation:* anchor vs.
  anchor-free — mAP vs. latency.
- **Self-supervised monocular depth:** photometric-reprojection depth, no depth
  labels needed. *Paper:* Monodepth2 (Godard et al.). *Ablation:* error by distance
  bucket (near vs. far). Builds on the homography work in my
  [Path Following Robot](/projects/#path-following-robot).
- **Datasets:** KITTI 2D / raw, BDD100K.
