---
name: Simulation
level: Intermediate
category: Robotics & Controls
icon: "🕹️"
featured: false
order: 15
aliases: ["Gazebo", "URDF", "CARLA"]
courses:
  - title: "ROS 2 Nav2 [Navigation 2 Stack] - with SLAM and Navigation"
    provider: "Udemy - Edouard Renard"
    link: https://www.udemy.com/share/107Tci3@yINUJzlLf7XTCS9oYYAYp8CsbHrD3gDjUi91uQGAgaBuFNfQMkehRlmcZWi3mC_6Lw==/
    summary: "Understand the Nav2 Stack with ROS2 - SLAM, Mapping, Navigation, Gazebo Simulation, Python Code."
    certificates:
      - /images/certificates/ROS2NAV2.jpg
---

<!-- SCAFFOLD: replace placeholders; projects auto-derive from tags. -->

Modeling robots and worlds before touching hardware — URDF descriptions and
Gazebo physics simulation.

**CARLA**, for the [Cloud-Native AV Perception Stack](/projects/#carla), pushed
this further: synchronous mode with a fixed 0.05 s timestep and a manually
ticked world, a seeded Traffic Manager also in sync mode, and sensor payloads
matched to a frame by the integer `world.tick()` returns rather than by "most
recent callback" — each sensor draining its own thread-safe queue until the
frames line up. Plus designing the sensor rig itself (RGB, instance
segmentation and depth co-located, a 64-channel LiDAR pinned to one full sweep
per tick, IMU and GNSS), and enumerating each town's OpenDRIVE landmarks before
committing to a class list. In a multi-sensor rig, assuming latest-wins is
exactly how you silently mislabel a dataset.
