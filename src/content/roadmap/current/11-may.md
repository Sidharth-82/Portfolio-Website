---
label: May
sublabel: "2027"
order: 11
---

**Tier 3 · Capstone — multi-task heads & joint training.** Grow the shared
backbone into a true multi-task model trained jointly.

- **Head B — BEV semantic segmentation** (road, lane, drivable area).
- **Head C — multi-object tracking** (persist identities across frames, reusing
  the Tier 2 temporal approach).
- **Optional Head D — occupancy prediction** for the "handles unknown objects"
  angle; **optional Head E — a short-horizon trajectory / planning head**, the
  step that turns a pure perception stack into a perception-to-planning system and
  ties it back to vehicle motion and control (as in UniAD / VAD).
- Train the heads **jointly** on the shared representation — only attempt the
  optional heads once A–C are solid.
