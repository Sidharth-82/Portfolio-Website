---
label: December
sublabel: "2026"
order: 6
---

**Tier 2 · Integration — camera–LiDAR fusion for 3-D detection.** Combine the two
modalities for stronger, more robust detection.

- Extend November's LiDAR detector with RGB: try **early fusion** (paint points
  with image features) and **late fusion** (separate branches merged before the
  head). Builds directly on September's calibration work. *References:* MVX-Net /
  PointFusion concepts; BEVFusion (Liu et al.) for the modern framing.
- **Mini-paper:** "early vs. late fusion at small scale" — report where fusion
  helps most (occluded / far objects) and where it adds cost for no gain.
