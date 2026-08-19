---
label: June
sublabel: "2027"
order: 11
---

**Tier 3 · Deployment — on-vehicle integration.** Put the node on the physical
robot and close the loop, reusing the platform from my
[Path Following Robot](/projects/#path-following-robot).

- **Bring-up:** sensor mounting and extrinsic calibration, a correct TF tree, and
  time synchronisation between camera and compute — the failure modes here are
  rarely in the model.
- **Close the loop:** feed detections into the **Nav2** costmap as an obstacle
  layer so perception actually changes vehicle behaviour (stop, slow, re-plan),
  rather than drawing boxes for a demo video.
- **Record everything:** every run logged to a **ROS bag** so failures can be
  replayed off-vehicle instead of reproduced by hand.
