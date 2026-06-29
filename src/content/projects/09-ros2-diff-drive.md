---
title: ROS2 Differential Drive Robot Simulation
summary: A simulated 2-wheel differential-drive robot built with ROS2, Nav2, and the SLAM Toolbox.
image: /images/projects/ros2-diff-drive.svg
github: https://github.com/Sidharth-82/ROS2_DiffDrive_Robot_ws
tags: [ROS2, Nav2, SLAM, Gazebo, URDF, RViz]
featured: false
order: 9
---

<!--
IMAGE NEEDED: Replace /images/projects/ros2-diff-drive.svg with the Gazebo +
SLAM map + RViz screenshot or the ROS 2 node graph from the portfolio PDF
("ROS2 Differential Drive Robot Simulation").
GITHUB: confirm/replace the repo link if a dedicated repo exists.
-->

**ROS2 Differential Drive Robot Simulation** is a self-directed project to build
fluency with the ROS2 ecosystem: a 2-wheel differential-drive robot created and
controlled with **ROS2, the Navigation 2 stack, and the SLAM Toolbox**.

## Highlights

- Modeled the robot in **URDF + XACRO** — 1 fixed chassis joint, 2 continuous
  wheel joints, and a frictionless front caster — plus a 360° LiDAR and a
  front-facing camera.
- Controlled the robot with **ros2_control** alongside **twist_mux** to arbitrate
  between teleop keyboard input and Nav2 path commands.
- Built the world in **Gazebo**; performed mapping, localization, and navigation
  in **RViz** with the SLAM Toolbox.
- Scripted autonomous control via the **Nav2 Simple Commander** Basic Navigator
  class.

## What I learned

This was my hands-on tour of the modern ROS2 navigation stack — URDF modeling,
SLAM, costmaps, and behavior trees — and the foundation for the rover and
TurtleSim work that followed.
