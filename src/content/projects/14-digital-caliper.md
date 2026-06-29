---
title: Digital Linear Caliper (MTE 202)
summary: An Arduino linear caliper using a rotary encoder, 3D-printed gears, and linear regression for calibration.
image: /images/projects/digital-caliper.svg
github: https://github.com/Sidharth-82
tags: [C++, Arduino, Rotary Encoder, Linear Regression]
featured: false
order: 14
---

<!--
IMAGE NEEDED: Replace /images/projects/digital-caliper.svg with the calibration
curve plot or the built caliper photo from the portfolio PDF ("MTE 202 – Digital
Linear Caliper").
GITHUB: confirm/replace the repo link if a dedicated repo exists.
-->

**Digital Linear Caliper** (MTE 202) is a linear measurement system built from an
**Arduino, a rotary encoder, and precision 3D-printed gears**.

## Highlights

- Wrote a **C++** script to process encoder data, incrementing a counter on each
  high→low pin transition and discerning rotation direction from pin-change
  timing.
- Applied **linear regression** against a calibrated reference caliper to derive a
  transformation equation converting encoder counts into millimeters.
- Achieved accurate, repeatable measurements through a calibrated secondary
  standard.

## What I learned

Turning raw quadrature counts into a trustworthy real-world measurement is a
calibration problem as much as a coding one — linear regression against a known
standard was the key to reliable accuracy.
