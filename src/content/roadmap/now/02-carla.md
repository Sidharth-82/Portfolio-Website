---
label: ADAS Perception Stack
sublabel: In progress
order: 2
---

**Measuring whether cloud-served perception can meet closed-loop highway
driving, and where it breaks.** The **8,400-frame** CARLA dataset is done, and the
YOLOv11 detector is trained: a failing van class was traced to low-diversity data
and fixed with a targeted capture (van recall **0.78 → 0.86**), at **8.9 ms p50** per
frame.

**Next:** a ROS 2 C++ closed-loop highway cruise controller targeting a Jetson Orin
Nano, scored against a ground-truth perception run.

[See the project →](/projects/#carla)
