---
label: August
sublabel: "2026"
order: 2
---

**Tier 1 · Foundations — segmentation & point clouds.** Dense pixel labels, then a
first hands-on look at 3-D data.

- **Drivable-area & lane segmentation:** fine-tune U-Net / DeepLabV3+ for
  road / lane / sidewalk classes; handle class imbalance and evaluate mIoU.
  *Paper:* DeepLabV3+ (Chen et al.). *Datasets:* Cityscapes, KITTI semantic.
- **Point-cloud classification & voxelization:** voxelization, farthest-point
  sampling, and permutation-invariant features — and visualize everything in
  **Open3D** (you need to *see* your point clouds). *Papers:* PointNet /
  PointNet++ (Qi et al.). *Dataset:* ModelNet for warm-up, then KITTI object
  clusters.

This builds directly on the CNN/transfer-learning footing from my
[PyTorch Image Classifier](/projects/#image-classification).
