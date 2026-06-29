---
title: Ball & Beam Motion Controller (MTE 484)
summary: A ball-on-beam motion controller designed with input–output parametrization and validated on hardware.
image: /images/projects/ball-beam-controller.svg
github: https://github.com/Sidharth-82
tags: [MATLAB, Simulink, Control Systems, System Identification]
featured: false
order: 5
---

<!--
IMAGE NEEDED: Replace /images/projects/ball-beam-controller.svg with the
ball-position-vs-reference response plot or the Simulink block diagram from the
portfolio PDF ("MTE 484 - Ball Beam Motion Controller").
GITHUB: confirm/replace the repo link — the portfolio notes a "publicly
available GitHub repository" but I don't have the exact URL.
-->

**Ball & Beam Motion Controller** (MTE 484) is a control-systems project: a
ball-on-beam controller designed using input–output parametrization through the
Direct Design methodology, then tuned and validated on real hardware.

## Highlights

- Designed controllers from detailed plant transfer functions (including
  *Y(s)/θ(s)*), accounting for motor stiction and ball static friction.
- Created **nonlinear compensation and dead-zone mitigation** strategies to
  improve steady-state tracking under low-angle conditions.
- Performed **system identification** and parameter refinement from experimental
  data to improve model fidelity and controller accuracy.
- Ran **MATLAB/Simulink** simulations to validate stability, feasibility, and
  robustness under LTI design constraints.
- Completed hardware testing and tuning, comparing real-world performance against
  theoretical and simulated results.

## What I learned

The gap between a clean LTI model and friction-dominated hardware is where real
control engineering happens. Building a nonlinear correction function to handle
low-angle stiction taught me to respect what the model leaves out.
