---
label: January
sublabel: "2027"
order: 7
---

**Tier 2 · Integration — Sensor fusion & multi-object tracking.** Combine camera +
LiDAR and add temporal consistency across frames.

- **Focus:** camera–LiDAR fusion, BEV fusion, multi-object tracking (MOT).
- **Key papers (suggested):** BEVFusion (Liu et al.); SORT / ByteTrack for
  tracking. Connects to the EKF sensor fusion in my
  [Mars Rover GPS Nav](/projects#mars-rover-gps).
- **Deliverable:** fuse camera + LiDAR detections and run a tracker on a nuScenes
  sequence, reporting MOTA/IDF1.

<!-- TODO: confirm fusion + tracking approach for this month. -->
