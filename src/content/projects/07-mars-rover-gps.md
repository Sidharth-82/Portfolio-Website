---
title: Mars Rover — GPS Navigation System
summary: A GPS-based autonomous navigation stack for the UW Robotics Mars rover using ROS 2 and Nav2.
image: /images/projects/mars-rover-gps.svg
github: https://github.com/Sidharth-82/UWRobotics_MarsRover
tags: [C++, Python, ROS2, Nav2, GPS, EKF, Docker]
featured: false
order: 7
---

<!--
IMAGE NEEDED: Replace /images/projects/mars-rover-gps.svg with the Mapviz
satellite/terrain screenshot or the ROS 2 node graph from the portfolio PDF
("UW Robotics Mars Rover – GPS Navigation System"). The rover SolidWorks render
also works.
-->

**Mars Rover — GPS Navigation System** is a GPS-based autonomous navigation stack
I built with **UW Robotics** for a Mars rover, enabling precise waypoint
following across desert-like terrain with variable elevation and surface
irregularities.

## Highlights

- Engineered an autonomous navigation system using **ROS 2 and Nav2** for precise
  waypoint following in rough, variable terrain.
- Implemented **multi-sensor fusion** with the ROS 2 `robot_localization`
  package, using **Extended Kalman Filters** to fuse GPS, IMU, and wheel
  odometry for accurate localization.
- Integrated **Azure Maps** tiles into the ROS 2 **Mapviz** framework for
  real-time terrain overlays and elevation data to improve global path planning.
- Developed an interactive **waypoint management system** in Mapviz for mission
  planning, real-time path modification, and seamless hand-off to the Nav2 stack.

## What I learned

Sensor fusion is the backbone of reliable outdoor autonomy — GPS alone is far too
noisy. Tuning the dual-EKF (`map → odom` global and `odom → base_link` local)
setup taught me how localization layers compose, and how to debug drift between
global and local frames.
