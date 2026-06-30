---
title: ROS2 TurtleSim — Chaser & Spawner
summary: A ROS2 Humble system where a chaser node pursues turtles spawned at random poses using a P-controller.
image: /images/projects/turtle-spawner-chaser.png
github: https://github.com/Sidharth-82/ROS2_Humble_Turtlesim_Chaser_ws
tags: [ROS2, Python, Pub/Sub, P-Control]
featured: false
order: 16
---

<!--
IMAGE NEEDED: Replace /images/projects/ros2-turtlesim.svg with the Spawner/Chaser
node diagram from the portfolio PDF ("ROS2 TurtleSim - chaser and spawner
automation"), or a screenshot of the running turtlesim.
GITHUB: confirm/replace the repo link if a dedicated repo exists.
-->

**ROS2 TurtleSim — Chaser & Spawner** is a learning project using **ROS2 Humble**:
a chaser turtle that continuously spawns and pursues target turtles.

## Highlights

- Established communication between two nodes via the **publisher–subscriber**
  model.
- Used turtlesim **services** for spawning and removing turtles.
- Drove the chaser by publishing `geometry_msgs/Twist` commands to the `cmd_vel`
  topic.
- Implemented a **P-controller** to guide the chaser toward each target, with the
  spawner publishing target `Pose` messages and a `/killTurtle` catch signal.
- Wrote a **launch file** to bring up all process nodes simultaneously.

## What I learned

A compact, end-to-end exercise in ROS2 fundamentals — nodes, topics, services,
custom control loops, and launch files — that made the larger ROS2 projects much
easier to reason about.
