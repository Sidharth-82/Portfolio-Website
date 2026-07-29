---
name: Computer Vision
level: Advanced
category: Machine Learning & AI
icon: "👁️"
featured: true
order: 8
aliases: ["OpenCV", "YOLOv8", "VLM"]
courses:
  # - title: "TODO: e.g. Computer Vision course"
  #   provider: "TODO: provider"
  #   link: https://example.com
  #   summary: "TODO: what this covered. This card shows a certificate."
  #   certificates:
  #     - /images/certificates/placeholder-certificate.svg
  - title: "ECE 495 - Autonomous Vehicles"
    provider: "University of Waterloo"
    link: https://uwflow.com/course/ece495
    summary: "Autonomous driving system overview; computer vision basics, deep learning for perception, motion modelling and state estimation, localization and mapping, object tracking, behavioral planning and reinforcement learning, path planning and vehicle control, safety and verification and validation, adoption and impact."
    certificates: []
---

<!-- SCAFFOLD: replace placeholders; projects auto-derive from tags. -->

Perception for robotics and autonomous driving — object detection (YOLOv8),
classical OpenCV pipelines, and multimodal vision-language reasoning.

Increasingly the geometry underneath it too. The
[Cloud-Native AV Perception Stack](/projects/#carla) meant deriving camera
intrinsics from FOV rather than storing them, projecting 3-D actor boxes into
2-D and 3-D labels across a left-handed world frame, decoding CARLA's packed
24-bit depth and 16-bit instance-ID buffers, and building the occlusion and
frustum filter that turns "every actor in the world" into honest visible-object
labels — with two separate mechanisms, because vehicles are actors with
instance IDs while signs are map objects that are not actors at all.
