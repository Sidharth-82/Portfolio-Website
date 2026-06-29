---
title: Path Following Robot (MTE 380)
summary: A real-time OpenCV vision system on a Raspberry Pi 5 that detects and tracks a path for autonomous navigation.
image: /images/projects/path-following-robot.svg
github: https://github.com/VictorKaraboychev/mobile-robot-vision-rp5
tags: [Python, Raspberry Pi, OpenCV, YOLOv8, Pure Pursuit, PID]
featured: true
order: 4
---

<!--
IMAGE NEEDED: Replace /images/projects/path-following-robot.svg with the CV
pipeline diagram (Calibration → Homography → HSV → Masking → Contour →
Pure Pursuit) or a frame of the detected red path from the portfolio PDF
("Path Tracking Robot Vision System - MTE 380").
-->

**Path Following Robot** is a collaborative MTE 380 project: an autonomous ground
robot that detects and tracks a red line on the ground in real time, built to
execute a Lego-figurine search-and-retrieval mission.

## Highlights

- Built a real-time computer-vision system on a **Raspberry Pi 5** using
  **OpenCV** for color-based path detection and following.
- **Camera calibration & distortion correction** — used
  `findChessboardCorners()` / `calibrateCamera()` to compute intrinsics, then
  `undistort()` / `initUndistortRectifyMap()` for geometrically accurate frames.
- **Perspective transform** — applied a homography (`getOptimalNewCameraMatrix()`
  + `findHomography()`) to map the camera view to a top-down, real-world
  coordinate system for precise distance estimation.
- **Feature extraction** — HSV thresholding (dual range for red hue wrap-around)
  + morphological filtering + `findContours()` to locate the path.
- **Pure Pursuit control** — computed a look-ahead point along the dominant
  contour, derived steering curvature (κ), and regulated it with a **PID loop**.
- Proposed and tested a **YOLOv8** model to notify the robot upon locating the
  target figurine.

## What I learned

Camera intrinsics and homography were the difference between "pixels" and
"meters." Getting the calibration right up front made the downstream Pure Pursuit
control far more stable than tuning gains against a distorted image ever could.
