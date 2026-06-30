---
label: October
sublabel: "2026"
order: 4
---

**Tier 1 · Foundations — tracking & lanes.** Add time and structured outputs, and
close out the foundational primitives.

- **2D multi-object tracking (tracking-by-detection):** feed July's detector into
  SORT / DeepSORT — a **Kalman-filter motion model**, Hungarian matching, and
  ID-switch analysis. This first taste of motion and state estimation is what links
  perception to vehicle motion and control downstream. *Papers:* SORT (Bewley et
  al.), DeepSORT (Wojke et al.). *Dataset:* KITTI tracking / MOT17.
- **Lane detection:** fit lane boundaries as polynomials via row-wise
  classification, not just segmentation masks. *Reference:* Ultra-Fast-Lane-
  Detection. *Dataset:* TuSimple.

End of Tier 1 — every primitive solid and individually written up.
