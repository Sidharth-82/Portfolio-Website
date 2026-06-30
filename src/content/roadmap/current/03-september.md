---
label: September
sublabel: "2026"
order: 3
---

**Tier 1 · Foundations — geometry & calibration.** The coordinate-transform
plumbing that every fusion and BEV method later depends on — don't skip it because
it feels "easy."

- **Camera–LiDAR calibration & point-cloud colorization:** project LiDAR points
  into the camera image and colorize the cloud with RGB; intrinsics / extrinsics,
  homogeneous coordinates, frame transforms. *Dataset:* KITTI raw + calib. This is
  the same sensor-fusion geometry behind my
  [Mars Rover GPS Nav](/projects/#mars-rover-gps).
- **Classical BEV via Inverse Perspective Mapping (IPM):** a non-learned
  homography warp from front camera to bird's-eye view, and its failure modes
  (slopes, occlusion). The "before" picture that makes learned BEV (Tier 2) easy
  to motivate.
