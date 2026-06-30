---
title: UWB Tag & Anchor Tracking System
summary: Capstone (FYDP) — a high-precision Ultra-Wideband system that locates people in crowded indoor/outdoor spaces.
image: /images/projects/uwb-tracking.svg
# github: https://github.com/Location-Tracking-FYDP
tags: [C++, TypeScript, PCBA, UWB, React, ThreeJS, PostgreSQL, Docker]
featured: true
order: 1
---

<!--
IMAGE NEEDED: Replace /images/projects/uwb-tracking.svg with the custom anchor
PCB render (DW3110 / STM32H750 layout) and/or the React + ThreeJS web app
showing tags on an uploaded floorplan. Both appear in the portfolio PDF
("FYDP - UWB Tracking System"). A PCB stack-up diagram also works well here.

ADDING MORE IMAGES: drop extra images anywhere in this description with normal
markdown — `![Anchor PCB layout](/images/projects/uwb-pcb.png)`. Paths are
root-relative to /public. They render full-width and are click-to-zoom in the
popup (same as the hero image). The alt text is also used as the fullscreen
label.

VIDEO INSTEAD OF AN IMAGE: the frontmatter `image:` may point to a video file
(.mp4/.webm/.mov…) — the tile plays it on hover and the popup shows it with
native controls. To embed a video inside this description, use raw HTML:
`<video src="/videos/uwb-demo.mp4" controls playsinline></video>` (root-relative
src; drop the file in /public).
-->

**UWB Tag & Anchor Tracking System** is my Mechatronics capstone (Final Year
Design Project): a high-precision Ultra-Wideband tracking system, built end to
end across custom hardware, embedded firmware, a positioning pipeline, a backend,
and a 3-D web frontend. It was designed to locate individuals in crowded
environments — such as amusement parks — to reduce the stress of child–parent
separation.

## Highlights

- Designed and fabricated custom anchor PCBs integrating the **DW3110 UWB chip,
  STM32H750 microcontroller, RTL8189 Wi-Fi module, and LAN8710A Ethernet PHY**,
  with controlled-impedance RF traces for accurate high-frequency signaling.
- Implemented a **Time Difference of Arrival (TDoA)** localization pipeline using
  a **Weighted Least Squares + Firefly Optimization** algorithm for sub-meter
  accuracy with minimal communication and battery use.
- Synchronized anchor clocks with SYNC and FOLLOW-UP frames for nanosecond-level
  timestamp reliability across the network.
- Built the backend — **PostgreSQL, Redis cache, and a REST API** — to ingest
  timestamps, compute position every second, and serve results to the frontend.
- Created a **React + ThreeJS** frontend that renders real-time 2D/3D tag
  locations on user-uploaded floorplans, with intuitive anchor configuration.
- Designed wearable tags to be lightweight, comfortable, waterproof (IP-X7), and
  durable under motion.

## What I learned

This project tied together every layer of an engineered system: RF PCB design,
real-time embedded firmware, optimization-based localization math, and a full
web stack. The hardest and most rewarding part was making nanosecond clock
synchronization reliable enough for the TDoA math to produce trustworthy
positions.
<!-- 
Live demo: [uwb-tracking-site.web.app](https://uwb-tracking-site.web.app) -->
