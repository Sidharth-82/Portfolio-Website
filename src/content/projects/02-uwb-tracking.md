---
title: UWB Tag & Anchor Tracking System
summary: Capstone — an indoor positioning system that locates transmit-only wearable tags to roughly 30 cm in 3-D, using custom RF boards and a wireless clock-sync model that holds a mesh of anchors in sub-nanosecond agreement.
image: /images/projects/uwb-tracking.svg
github: https://github.com/Location-Tracking-FYDP
tags:
  - C++
  - TypeScript
  - PCBA
  - UWB
  - FreeRTOS
  - React
  - ThreeJS
  - PostgreSQL
  - Redis
  - WebSocket
  - Docker
featured: true
order: 2
---

<!--
COLLAPSIBLE SECTIONS: same contract as 00-carla.md and 01-pendulum.md. The
<details>/<summary> blocks are raw HTML passed through by `marked`, and two
blank lines are load-bearing:

  <details>
  <summary>Title</summary>
                        <- REQUIRED blank line, else the body renders as raw HTML
  markdown body
                        <- REQUIRED blank line
  </details>

`<details open>` expands one by default; "Wireless clock synchronisation" is the
one currently open, because it is both the hardest part of the system and the
part that is mine.

ATTRIBUTION: this was a team FYDP. The "My scope" block is deliberate and was
confirmed with Sid on 2026-08-21: PCB/hardware, the anchor firmware clock-sync
model, and the TDoA WLS solver. Everything else on the page is described as
system context, not as personal work, and the two sections covering teammates'
work say so inline. Do NOT quietly widen these claims — an interviewer drills
into whatever the page asserts.

CHIP: ESP32-S2, not S3. Source of truth is uwb-anchor-firmware/platformio.ini
(`board = esp32-s2-saola-1`) and the `info` command output in README.md
("Chip Model: ESP32-S2"). The resume, the knowledge base, and the old version of
this page all said S3 — those need correcting separately.

TAGS: "PCBA" resolves via skills/19-embedded-hardware.md, "UWB" via
14-odometry-localization.md, "ThreeJS" via 16-react.md, and "WebSocket" via
20-apis.md. "FreeRTOS" and "Redis" are deliberately unmatched and render as plain
chips until there are skill pages to back them.

MEDIA TODO: uwb-tracking.svg is a placeholder. The strongest replacement is a
screen capture of the 3-D map view with a tag moving live over an uploaded
floorplan. Second choice is a photo of the populated anchor PCB.

NUMBERS: firmware timing constants come from uwb-anchor-firmware/include/uwb_task.h
and hardware.h. Solver constants come from uwb-tracking-site/backend (utils/tdoa.ts
and services/anchorPositionService.ts). Pipeline timings are the profiled figures
published in backend/TDOA_PIPELINE.md. The ~30 cm accuracy figure is the measured
demo result. Keep the caveats in "Keeping it honest" attached to these.

OLD LINK, currently dead: uwb-tracking-site.web.app — restore as a live-demo line
if the Firebase deployment goes back up.
-->

**UWB Tag & Anchor Tracking** is my Mechatronics capstone: an indoor positioning
system that finds a person wearing a small tag, in three dimensions, to roughly
**30 cm** — in buildings and crowds where GPS is useless. The motivating scenario
was an amusement park, and the specific fear of a parent losing sight of a child.

It is built end to end. Custom **Ultra-Wideband RF boards**, embedded firmware that
turns a scattering of those boards into a self-organising synchronised mesh, a
positioning solver, a backend, and a 3-D web interface that draws live tag
positions on an uploaded floorplan.

## At a glance

- **What it is:** a University of Waterloo Final Year Design Project, taken by a
  student team from blank schematic to working demo.
- **What it does:** tracks battery-powered wearable tags to about **30 cm in 3-D**,
  indoors, with many tags at once.
- **My scope:** the **hardware and PCB design**, the **wireless clock-synchronisation
  model** in the anchor firmware, and the **TDoA weighted-least-squares solver** on
  the backend. The rest of the system is described here as context.
- **The hard part:** at the speed of light, **one nanosecond of clock error is about
  30 cm of position error.** The whole accuracy budget is a clock problem.
- **Stack:** C++ / FreeRTOS on ESP32-S2 with a Qorvo DW3110 UWB radio; TypeScript,
  PostgreSQL, Redis and WebSockets on the server; React, React Three Fiber and
  Three.js on the client.

## The decision everything else follows from

There are two standard ways to locate a UWB tag, and picking between them decides
the shape of the entire system.

**Two-way ranging** has the tag talk back and forth with each anchor and time the
round trip. It is simple, and it is self-correcting — because the same tag clock
starts and stops the measurement, the tag's clock error cancels out. But every fix
costs several transmissions *per anchor*, and the tag has to both transmit and
receive.

**Time Difference of Arrival** has the tag do nothing but shout, once. Anchors
record when the shout arrived at each of them, and the *differences* between those
arrival times place the tag on a set of hyperboloids that intersect at its
position.

We chose **TDoA**, for two reasons that had nothing to do with the math:

- **Scale and battery.** The design target was thousands of tags in a park. TDoA
  costs one short broadcast per tag per fix, no matter how many anchors are
  listening. That is what makes a coin-cell wristband last, and what stops the
  radio channel from saturating as tags are added.
- **Privacy.** A transmit-only tag cannot be located by anyone who does not own the
  anchor network. A stranger with a receiver learns nothing useful. With two-way
  ranging, the tag answers whoever asks.

The cost of that choice is brutal, and it is the reason this project was hard: the
tag's clock has dropped out of the equation, but **the anchors' clocks have not.**
TDoA subtracts timestamps recorded by *different physical devices*. Every
nanosecond those devices disagree by is 30 cm of error handed straight to the
solver. So the project stops being about radios and becomes about **synchronising a
mesh of independent clocks, wirelessly, to well under a nanosecond.**

## System shape

- **Tags** broadcast a short UWB frame once per second carrying an ID, a battery
  reading and a sequence number. They never listen. That is the entire tag protocol.
- **Anchors** are fixed, mains-powered boards on the ceiling. They timestamp every
  tag broadcast, keep themselves synchronised to a shared clock over the air,
  measure their own distances to each other, and forward results over WiFi.
- **The server** collects timestamps into Redis, runs a positioning solve once per
  second, writes positions to PostgreSQL, and pushes updates to browsers over a
  WebSocket.
- **The frontend** renders tags and anchors in 3-D on user-uploaded floorplans,
  with per-floor stacking and tools for placing and calibrating the map.

## How it works

Each layer below is expandable. The clock-sync section is open by default because
it is where the accuracy actually comes from.

<details open>
<summary>Wireless clock synchronisation — my part, and the crux of the system</summary>

Every anchor has its own crystal oscillator. Two crystals of the same part number
disagree in both **offset** (what time they think it is) and **rate** (how fast they
think time passes). Left alone, two anchors drift apart by tens of nanoseconds
within seconds — many times the entire error budget.

There is no wired sync line, and GPS does not work indoors. So synchronisation has
to happen over the same UWB radio that does the tracking.

**The beacon.** Every anchor broadcasts a sync beacon every **200 ms**, carrying its
stratum, the ID of the anchor it is synced to, a sequence number, its TDMA slot —
and the transmit timestamp of its **previous** beacon, expressed in master time.

**Why the previous beacon's timestamp?** The radio latches a transmit timestamp at
the instant the frame leaves the antenna, which is *after* the frame's contents were
assembled. You cannot put a beacon's own transmit time inside itself without
predicting it. Deferring by one beacon removes the prediction entirely and replaces
it with a measured number. It costs one beacon interval of latency and buys exact
timestamps.

**The estimator.** A receiver pairs the leader's transmit timestamp of beacon *N−1*
with its own recorded receive timestamp of beacon *N−1*. That aligned pair is one
observation of the clock relationship:

- **Offset** comes from a single pair — the difference between the two timestamps,
  minus the **propagation delay**, which is computed from the physically measured
  distance to that neighbour. Light takes real time to cross a room, and at this
  precision that flight time is not a rounding error.
- **Rate (drift)** comes from comparing two consecutive pairs: how much the
  follower's clock advanced versus how much the leader's did.

Both are smoothed with exponential filters — a slow one on drift, a faster one on
offset — so a single noisy beacon cannot yank the model. The offset filter runs as
a predict-then-correct step: predict where the offset should be using the current
drift estimate, compare against the new measurement, and correct by a fraction of
the difference. That residual, the **innovation**, is kept as a live quality metric.
A well-behaved link has small innovation; a link going bad announces itself before
positions start drifting.

**The tree.** One anchor is the master. Every other anchor selects a sync source
from its neighbours by **lowest stratum first — fewest hops to the master — breaking
ties on lowest innovation**, so among equally-distant sources it follows the most
self-consistent clock. Sources that have gone quiet for five beacon intervals are
excluded. If nothing suitable is available, an anchor holds its existing source for
up to ten intervals before declaring itself unsynced, so a handful of lost beacons
does not collapse the tree. Chains are capped at 15 hops, because error compounds
along the chain.

**Applying it.** Correcting a local timestamp into master time is offset plus drift
times elapsed — with explicit **40-bit wraparound arithmetic**, because the radio's
counter is 40 bits at roughly 15.65 picoseconds per tick and rolls over about every
17 seconds. Handling that wrap correctly is unglamorous and non-negotiable: get it
wrong and once every 17 seconds a tag teleports.

</details>

<details>
<summary>TDMA — turning a shared clock into scheduled airtime</summary>

Once the anchors agree on the time, they get collision avoidance almost for free,
and they need it: every anchor is broadcasting beacons and running ranging exchanges
on one shared channel, and transmissions that overlap are simply lost.

The corrected master clock is divided into a repeating **50 ms frame of 16 slots**,
about **3.1 ms each**. An anchor transmits only inside its own slot and sleeps
otherwise, waking early to receive. The frame length is chosen to exceed the worst
expected sync error plus the duration of a full ranging exchange, so a slot is
genuinely private.

Slots are **claimed, not assigned**. A booting anchor looks at which slots its
neighbours advertise and picks the free slot with the **largest gap to any occupied
one**, so slots spread across the frame instead of clumping and the network degrades
gracefully as it fills. If two anchors land on the same slot, the one with the higher
ID yields and re-picks. No negotiation protocol, no coordinator, no handshake — just
a deterministic rule every node can evaluate alone.

The dependency runs in a circle, which is the interesting part: sync enables
scheduling, scheduling reduces collisions, fewer collisions means cleaner beacons,
and cleaner beacons mean better sync. It bootstraps from the master outward.

</details>

<details>
<summary>Anchors that survey their own positions</summary>

A TDoA fix is only as good as the assumed anchor coordinates. An anchor recorded
20 cm from where it actually hangs pushes that error into every tag position near
it, permanently. And hand-measuring ceiling-mounted anchors across a venue is the
most tedious and least reliable step of an install.

So the anchors measure themselves. Between tracking duties they run **double-sided
two-way ranging** with each neighbour — a short exchange whose timestamp algebra
cancels both clock offset and rate, giving a distance that does not depend on the
two anchors being synchronised. Results outside the 50 m design range are discarded,
and per-link success and failure counts are kept so a bad link is visible rather
than silently averaged in.

Anchors post those pairwise distances to the server, which reconstructs the geometry:

- **Incremental placement.** Repeatedly take the unplaced anchor with the most
  measured links to already-placed ones, and position it — multilateration with four
  or more references, trilateration with three, a two-reference geometric placement
  as a fallback. Most-connected-first means every placement is made with the most
  evidence available at that moment.
- **Global refinement.** Once everything is placed, a **Levenberg–Marquardt** pass
  adjusts all positions together to minimise the squared error between measured and
  implied distances, so early placement mistakes get pulled back out instead of
  propagating.
- **Fixing the gauge.** Distances alone determine *shape*, not *pose* — the whole
  network can be translated, rotated or mirrored and fit the data identically. The
  solver resolves this either from user-supplied constraints (any anchor coordinate
  can be locked on a per-axis basis and is then treated as fixed) or, with no locks
  at all, by pinning the first anchor to the origin and the second to the positive
  X-axis and solving the rest freely.

The solver is benchmarked against synthetic room-shaped layouts with **20 cm
standard-deviation Gaussian noise** injected into every distance, so it is evaluated
on how it behaves with realistic measurement error rather than on clean inputs.

*This solver was a teammate's work; the ranging measurements it consumes come from
the anchor firmware.*

</details>

<details>
<summary>The position solve — weighted least squares, then a swarm</summary>

This is the other piece that is mine. A tag broadcast produces one arrival timestamp
per anchor that heard it. Position comes out in two stages.

**Stage one: weighted least squares.** Converting arrival-time differences into
range differences turns the geometry into a system that can be rearranged into
linear form and solved in closed form — build the coefficient matrix from the
differences in anchor positions, solve the normal equations with a weight matrix,
and add the reference anchor's position back. Fast, deterministic, no initial guess
needed.

It is **weighted** rather than ordinary because the measurements are not equally
trustworthy. Anchor geometry, distance and signal quality all vary across the
network, and ordinary least squares implicitly asserts they do not.

The solve needs at least **four** anchors, and uses the **six earliest arrivals**.
Earliest is a useful proxy for best: the closest anchor generally has the strongest,
cleanest first path, and the later arrivals are the ones most likely to be
reflections rather than direct line of sight.

**Stage two: firefly refinement.** The closed-form solution is a *linearised* answer,
and linearisation is exactly what noise punishes — the algebra that makes it solvable
also bakes in a bias. So the WLS output is used as a seed rather than an answer. A
small **firefly swarm** — nine candidates scattered within three metres of the seed,
nine iterations, each candidate drawn toward better-scoring neighbours with a random
component for exploration — minimises the true nonlinear residual directly.

The reason for a metaheuristic rather than a gradient method is that it needs no
derivatives and does not care that the cost surface is non-convex or that a bad seed
sits in a local basin. Eighty-one cost evaluations per tag per second is cheap enough
to run for hundreds of tags on a single node, and enough to walk out of a bad seed.

</details>

<details>
<summary>The ingest pipeline — and why stale positions get thrown away</summary>

Anchors POST their accumulated measurements once per second over WiFi, behind an
API key.

- **Redis** holds incoming measurements in per-tag lists with a **60-second TTL**.
  In-memory writes absorb bursts from many anchors without touching disk, and the
  TTL means a stalled consumer cannot silently accumulate a backlog.
- **A one-second scheduled job** drains everything, fetches current anchor positions
  — only from anchors with a **heartbeat in the last 20 seconds**, so an anchor that
  has fallen off the network stops contributing — and solves every tag concurrently.
- **PostgreSQL** takes all resulting positions in a single batched insert rather than
  one round trip per tag.
- **A WebSocket** pushes the new positions to subscribed browsers immediately, so the
  client is not polling for data that arrives on a known cadence.
- **Redis is then cleared unconditionally** — including for tags whose solve failed.
  That is a deliberate call: fresh measurements are one second away, and a
  confidently-drawn stale position is worse than a gap. Retrying old timestamps would
  draw someone where they used to be.

Positions are stored in the solver's own frame and transformed into world coordinates
on the way out, via a stored rotation and offset. Re-aligning the map to the building
is therefore a config change, not a re-survey.

</details>

<details>
<summary>The 3-D interface</summary>

The client is React with React Three Fiber, and it exists so the system can be set up
by someone who is not on the team.

- **Floorplans** are uploaded as images or PDFs and scaled by drawing a line across a
  known dimension — two clicks and one measurement converts pixels to metres.
- **Multiple floors** stack vertically, with each floor's visible Z range extended
  into its neighbours so a tag near a boundary fades rather than popping in and out.
- **Anchors and tags** render live, with an in-view measuring tool and dialogs for
  editing anchor positions, locking axes for the survey solver, and adjusting the
  coordinate frame.
- **Motion smoothing** bridges the one-second update cadence: positions interpolate
  toward each new target frame-rate-independently, then extrapolate along the computed
  velocity once the interpolation converges. Without it, tags either teleport every
  second or freeze between updates.

*Frontend work was a teammate's.*

</details>

<details>
<summary>Making it installable by someone who is not an engineer</summary>

A system that needs a laptop and a serial console per device does not get deployed
across a venue. Three things in the firmware exist purely for that:

- **WiFi credentials ride along in the sync beacon.** An anchor that is connected
  piggybacks its credentials onto its periodic broadcast, and an unprovisioned
  neighbour that hears it picks them up over UWB. Configure one anchor; the rest of
  the mesh provisions itself outward. Anchors also self-register with the server on
  connect and identify by MAC, so nothing needs to be assigned by hand.
- **Network-wide reboot over UWB**, with a post-boot deadband so a reboot command
  cannot echo into a loop, and a short delay before acting so each node rebroadcasts
  the command before dropping off.
- **LED status codes** that distinguish missing credentials, WiFi failure, an
  unreachable server, SPI failure, an unassigned ID, and normal operation — so an
  installer on a ladder can tell *which* thing is wrong from the ground.

</details>

## By the numbers

- **~30 cm 3-D accuracy** on a tag in the demo environment.
- **Sub-nanosecond** anchor clock agreement — the requirement that the accuracy
  figure depends on.
- **40-bit timestamps at ~15.65 ps resolution**, wrapping every ~17 seconds.
- **5 sync beacons per second per anchor**; **16 TDMA slots** in a **50 ms** frame.
- **50 m** maximum anchor-to-anchor ranging distance.
- **1 Hz** tag broadcast — one short transmission per fix, regardless of anchor count.
- **250–950 ms** per full solve cycle when profiled at a load of **500 tags across
  27 anchors**.
- **≥4 anchors** required per fix, best **6** arrivals used.

## Keeping it honest

- The **30 cm** figure is a measured demo result in a room with good anchor geometry.
  TDoA accuracy is dominated by **geometric dilution of precision** — anchors placed
  nearly in a line or nearly in a plane amplify the same ranging error into far worse
  position error, and no solver choice compensates for that. The number is a
  demonstrated result, not a guarantee across arbitrary installs.
- The **500-tag, 27-anchor** timing is a **profiled load figure**, not 500 physical
  tags in a park. It says the compute scales; it does not say the RF layer was tested
  at that density.
- **End-to-end latency is the weakest number.** Under the original polling design,
  ping-to-pixel was around **5 seconds**, while the solve cycle itself measures
  250–950 ms — so most of it was pipeline and polling overhead rather than solver
  cost. Pushing over a WebSocket replaced the polling, but the full end-to-end figure
  has not been re-measured, so I quote it as unknown rather than fixed. Fine for
  "where is my child"; nowhere near good enough for anything actuating.
- The **firefly parameters** — nine candidates, nine iterations, a three-metre search
  radius — were tuned empirically against a compute budget, not derived from a
  convergence analysis.
- The anchors **restart themselves hourly**. It is a hedge against long-run drift and
  slow leaks, and it is a crutch rather than a root-cause fix.

## What I learned

**The hard problem was not the one on the label.** This reads like an RF project.
Almost all of the difficulty was in distributed timekeeping — beacon design, filter
tuning, source selection, wraparound arithmetic. Choosing TDoA is choosing to make
clock synchronisation your problem, and that consequence was not obvious when the
choice was made.

**Sub-nanosecond means the physics stops being an abstraction.** The propagation
delay between two anchors sitting in the same room is a term you must subtract, not a
detail you may ignore. Precision changes which effects are real.

**Measure the thing rather than assume it, then measure how much you trust it.**
Anchor positions are surveyed by the network instead of by a tape measure. Clock
offsets are estimated with a model that also reports its own residual. In both cases
the second-order quantity — how confident the estimate is — turned out to be worth as
much as the estimate, because it tells you which link to distrust before the output
goes visibly wrong.

**Ambiguity has to be resolved deliberately.** Pairwise distances fix the network's
shape but not its position or orientation, and a solver handed an under-determined
problem returns a confident, arbitrary answer. Recognising what the data genuinely
cannot determine — and then supplying that information explicitly — was the
difference between a solver that converges and one that quietly lies.

**Deployability is a design requirement, not packaging.** Credential propagation over
UWB, self-registration, network reboot and legible LED codes are not features anyone
asked for. They are what separates a system that works on a bench from one that can
be installed on a ceiling.
