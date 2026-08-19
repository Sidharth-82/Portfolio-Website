---
label: July
sublabel: "2027"
order: 12
---

**Tier 3 · Deployment — reliability, regression testing & write-up.** Turn a
working demo into something with evidence behind it.

- **Automated regression suite:** replay the recorded bags through the stack on
  every change and assert on detection rate, latency, and false positives —
  failures should surface from a test run, not from watching the robot.
- **Failure analysis:** categorise what actually broke on-vehicle (lighting,
  motion blur, dropped frames, sensor occlusion, thermal throttling) and fix the
  top two.
- **Two ablations:** degraded-sensor behaviour (one camera dropped, low light),
  and on-robot vs. off-board inference — where latency, power, and reliability
  actually trade off.
- **Write it up** as a new [project tile](/projects) — problem, architecture,
  measurements, failure modes, limits. A perception stack that ran on real
  hardware, with numbers, is the artifact this whole roadmap exists to produce.
