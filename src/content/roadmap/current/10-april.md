---
label: April
sublabel: "2027"
order: 10
---

**Tier 3 · Capstone — shared backbone & first head.** Begin a mini unified
multi-task perception stack (in the architectural spirit of BEVFusion / UniAD): a
**shared BEV / sparse-query backbone** feeding several task heads.

- **Scope & pipeline:** stand up a reproducible nuScenes-mini pipeline, choose
  metrics (NDS / mAP, mIoU, MOTA / IDF1), and study **OpenPCDet** and
  **mmdetection3d** as scaffolding — read the code, don't just copy it.
- **Shared encoder + Head A:** fuse multi-camera + LiDAR into a common BEV
  representation (combining Tier 2's fusion and lifting work), with the 3-D
  **object-detection** head first (boxes, class, velocity).
- Debug on a small data fraction before scaling up.
