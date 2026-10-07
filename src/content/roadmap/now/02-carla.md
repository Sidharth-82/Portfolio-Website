---
label: AV Perception Stack
sublabel: In progress
order: 2
---

**A highway perception stack split between an onboard real-time tier and an AWS
cloud tier**, built to measure whether delayed cloud perception is still safe to act
on. The **8,400-frame** CARLA dataset is done, and the first YOLOv11 detector run
clears a **0.85 recall** gate on cars, trucks and motorcycles.

**Next:** fixing the one class that misses it (vans) before moving training to the
cloud.

[See the project →](/projects/#carla)
