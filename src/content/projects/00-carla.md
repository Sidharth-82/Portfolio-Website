---
title: Cloud-Native ADAS Perception Stack
summary: A highway driving stack in CARLA, built to measure whether cloud-served perception can meet closed-loop highway driving, and exactly where it breaks.
image: /images/projects/carla.png
github: https://github.com/Sidharth-82/AWS-Cloud-Native-AV-Perception-Stack
tags: [Python, C++, ROS2, YOLOv11, CARLA, LiDAR, AWS, Docker, Computer Vision, PyTorch, Data Pipelines]
featured: true
spotlight: true
status: In Progress
order: 0
---

<!--
COLLAPSIBLE SECTIONS: the <details>/<summary> blocks below are raw HTML passed
straight through by `marked`. Two blank lines are load-bearing:

  <details>
  <summary>Title</summary>
                        <- REQUIRED blank line, else the body renders as raw HTML
  markdown body
                        <- REQUIRED blank line
  </details>

Add `open` (`<details open>`) to expand one by default. Styling lives in
src/styles/global.css under ".rich-text :where(details)".

MEDIA TODO: `image:` still points at /videos/projects/carla-demo.mp4, which does
not exist yet. Until the clip lands in public/videos/projects/ the tile shows an
empty black box. Best candidates for the hero clip, in order:
  1. A drive with tracked vehicle boxes + lead distance + detected speed limit
     overlaid live (this is the Phase 5 money shot).
  2. Phase 1 sanity-viz: projected 3D boxes rendered onto captured frames.
Note the site plays this muted + looping, and the grid tile resets to t=0 on
mouse-leave, so front-load the payoff and keep it 16:9 (object-cover crops).

TAGS: "CARLA" now resolves via the `aliases` of skills/15-simulation.md, and
"AWS" and "Data Pipelines" have their own skills (21-aws.md, 22-data-pipelines.md).
"YOLOv11" and "LiDAR" have no skill page and render as plain chips.

PLAN: phases 3+ follow the 2026-10-03 rescope in the project's Phase 0 thesis
§11-12 (edge-first C++ closed loop, cloud arm postponed). Keep this page in step
with the Robotics resume (V3.0): same title, same numbers.

NUMBERS: "Phase 1 by the numbers" now carries OBSERVED values from the completed
run (dataset version v3), not configured targets. Source of truth is
Phase 1/config/metadata.json -> runs[].class_histogram and the published
class_histogram.md. Update both together if the dataset is regenerated.
-->

**Cloud-Native ADAS Perception Stack** is the project I am building full time
right now. A simulated sedan drives a highway in **CARLA**, and the question is
whether its perception can live in the cloud — on **AWS** — and still be fast
enough to drive on, or where exactly that breaks.

The interesting part is not the models. It is the question the split forces you
to answer.

## The question this project answers

Real-time AI at the edge is expensive: you pay for GPU hardware in every vehicle.
Cloud inference is far cheaper per unit of compute, but it buys that saving with
latency and connectivity risk. **By the time a cloud answer comes back, the world
has moved.** Most portfolio projects pick a side and move on. This one measures
the trade.

You can't measure what latency costs a driving system without a driving system,
so the build is sequenced:

1. **Edge first.** A closed-loop highway cruise controller — lane keeping plus
   distance keeping — running entirely on an edge target, in **ROS 2 C++**. This is
   the baseline the cloud is judged against.
2. **Then cloud.** Move perception to AWS and measure what the added latency does
   to the same closed-loop scenarios — collisions, lane departures, gap
   violations — rather than arguing about it.

Every result is scored against a **ground-truth perception run**: the same
scenarios driven with CARLA's perfect boxes. The difference in failures between
ground truth and the real detector is the detector's cost, in the units a driving
system is actually judged in.

That comparison is only possible because of a decision made in Phase 1: the
dataset and the simulator carry a **fully timestamped ground-truth timeline**, so
any output can be scored against what was true when it was *consumed*, not when it
was *computed*.

## System shape

- **CARLA** spawns the ego sedan plus traffic and streams a synchronized sensor set:
  front RGB camera, depth camera, 64-channel LiDAR, IMU and GNSS. It runs headless
  on EC2 GPUs in its own container.
- **Perception:** a **YOLOv11** vehicle detector on the camera, combined with LiDAR
  into 3-D boxes, and an **EKF tracker** that turns per-frame detections into tracks.
- **Lane detection** on the image, so boxes outside the relevant lanes are ignored.
- **Planner and controller:** classic and deterministic — no neural network after
  perception. Commands go back to CARLA over a ROS 2 topic.
- **Edge target:** a **Jetson Orin Nano** runs the stack (not the simulator). Until
  the hardware exists, edge is simulated on a comparable cloud instance.
- **Offline path, built first:** CARLA writes raw capture to S3, offline processing
  turns it into a labeled KITTI-format dataset, and that dataset trains the detector.

## Build phases

Each phase has an explicit definition of done. I write the phase document first,
argue with it, lock the decisions, then write code against it. The phase
documents are the design record.

<details>
<summary>Phase 0: Frame the problem, lock the narrative (Complete)</summary>

Objective: decide the exact perception task and the story before writing a line
of code. The pitfall here is picking a scope so broad you can never call it
finished, so this phase ends in hard locks:

- **Setting:** highway only. **Ego:** a sedan, fixed across every run.
- **Hero outputs:** vehicle detection with tracking and lead-vehicle distance.
  Lane geometry is the onboard real-time counterpart. Speed-limit sign reading was
  scoped in here and later dropped on evidence — see the Phase 1 section.
- **Scope fence:** perception ends after those outputs. Driving behaviour and
  control are explicitly deferred to a later phase, which kills the most likely source
  of scope creep before it starts.
- **Definition of complete is quantitative**, not vibes: baseline accuracy targets
  met, plus, per cloud output, a logged p50 and p95 end-to-end age and a
  quantified delay-induced error against relative speed.

</details>

<details open>
<summary>Phase 1: Stand up the simulator and generate the dataset (Complete)</summary>

Objective: a reproducible pipeline that turns N scenario configs into a stored,
labeled dataset with a data card describing it. This is the phase that is
finished, and the section below covers it properly.

## Phase 1 in depth

Phase 1 is done, and it is where most of the engineering judgement lives so far.
Each decision below is expandable.

<details>
<summary>Splitting the pipeline so the GPU is only up when it must be</summary>

CARLA is an Unreal Engine renderer. Even headless, the cameras and LiDAR are
GPU-rendered, so there is no running it on a laptop without an NVIDIA GPU. I do
not have one, so CARLA runs on an **EC2 g4dn.xlarge spot instance** (T4, 16 GB) in
AWS us-east-1, at roughly 0.15 to 0.20 USD per hour instead of 0.53 on demand.

That makes GPU time the scarce resource, so the pipeline is split by what
genuinely needs a GPU:

- **On the GPU box:** drive the scenarios and dump *raw* output. Camera images,
  LiDAR points, every actor bounding box and transform, sensor calibration, ego
  pose, and the weather, map, and time tags.
- **Offline, on CPU:** project boxes into 2D and 3D, run the occlusion and
  in-frustum filter, package to KITTI, assign splits, and write the data card.

Raw never leaves the instance. Both halves run on the same box in separate
containers, so raw is written to the instance store and read from local disk;
publishing it would mean roughly 200,000 S3 PUTs for data the next stage reads
locally anyway. Only the finished, versioned dataset is uploaded. The tradeoff is
explicit rather than accidental: re-tuning a filter threshold is free while the
instance is alive and costs a re-capture afterwards, so the sample renders get
checked before the box is released.

Slower in wall-clock terms, dramatically cheaper, and it means every offline
decision is re-runnable without ever going back to the GPU.

</details>

<details>
<summary>Raw capture, filtered later</summary>

The capture-side records are deliberately **unfiltered**. Every actor CARLA
reports gets written, including ones that are occluded or outside the frustum,
and the per-frame record schema has no `visible` field at all. Visibility is a
derived property computed offline, so baking one filter threshold into data that
costs GPU hours to regenerate would be an expensive mistake to undo.

The same principle drives the class map. Each object records its `blueprint_id`,
`base_type`, and `listed_speed_kph`, and the dataset class name is applied by the
KITTI writer, not at capture time. That makes the class list a **config knob**, and
it paid for itself: when the evidence said speed-limit signs could not reach a
trainable count, dropping them from the label set cost one config edit and an
offline re-run, with no re-capture, because the signs are still sitting in the raw
records. Record fine-grained, decide coarse later.

</details>

<details>
<summary>The scenario matrix and the split that actually tests generalization</summary>

Fourteen scenes, 300 seconds each, sampled at **2 Hz** from a 20 Hz simulation.
Sampling every tick would be pointless: at highway speed, consecutive 20 Hz frames
are near-duplicates that inflate the frame count without adding information, and
they leak information across splits.

Splits are assigned at the **scene level, never the frame level**:

- **Train:** Town04 and Town06, day and night, low and high traffic density.
- **Validation:** the same two towns but unseen routes, unseen seeds, and a
  traffic density (mid) that never appears in training. Close enough to the
  training distribution to be useful for model selection.
- **Test:** Town05, a **completely held-out map**. The model has never seen that
  geometry.

Testing on an unseen map is the strongest answer I have to the Phase 1 pitfall of
a dataset so uniform that the model looks great and generalizes to nothing.

The split is recorded twice on purpose, once per scene and once on the capture run
that produced it, and the processor refuses to start if the two disagree. "No scene
spans two splits" is the claim that makes the test number mean anything, so it is
enforced rather than trusted. Validation carries four scenes rather than two
because the first full histogram showed it holding too few instances of the rarer
vehicle classes to measure them — a healthy total hiding an unmeasurable split.

</details>

<details>
<summary>Determinism as a hard requirement</summary>

- **Synchronous mode with a fixed 0.05 s timestep**, ticking the world manually.
  Asynchronous mode gives misaligned sensor frames and non-reproducible runs, so
  this is non-negotiable.
- The **Traffic Manager runs in sync mode too**, with a per-scene seed, and the
  spawn RNG is seeded from the same scene config.
- Sensor payloads are matched to a frame by the integer returned from
  `world.tick()`, never by "the most recent callback". Each sensor callback
  enqueues `(frame, data)` onto its own thread-safe queue, and the snapshot drains
  each queue until it finds the matching frame. In a multi-sensor rig, assuming
  latest-wins is exactly how you silently mislabel data.
- **Bicycles are excluded from spawn.** They do not belong on a highway, and as a
  class they could never reach their instance target. A class that can never be
  satisfied is worse than no class at all.

</details>

<details>
<summary>The sensor rig</summary>

A front-focused rig, `front_v1`, designed so five more cameras can be added later
without a schema change:

- **`cam_front`**: RGB, 1280x720, 90 degree FOV, mounted 1.5 m forward and 1.6 m
  up. Intrinsics are **derived** from width, height, and FOV rather than stored
  alongside them, because storing both invites drift.
- **`cam_front_instance_seg`**: co-located with the RGB camera, giving a semantic
  tag per pixel plus an opaque separator between two same-class vehicles whose
  boxes overlap.
- **`cam_front_depth`**: also co-located, and **the occlusion oracle**. A pixel
  blocks an object if it is rendered nearer than that object's box.
- **`lidar_top`**: 64 channels, 100 m range, 1.3 M points per second, rotation
  frequency pinned to 20 Hz so exactly one full sweep completes per tick. A
  mismatch there gives partial or duplicated sweeps.
- **IMU and GNSS** for ego state. These are explicitly *not* perception inputs;
  the detector never sees them. They exist for ego-motion in tracking.

The ego vehicle is a fixed Tesla Model 3 across every single scene. Swapping the
ego between runs would change camera height and mounting geometry, which shifts
the entire data distribution. That is a confound, not useful diversity.

</details>

<details>
<summary>The encodings that quietly destroy a dataset</summary>

CARLA's depth and instance-segmentation cameras do not emit literal images. They
pack data into RGB channels, and reading them as ordinary images gives garbage:

- **Depth** is 24-bit, packed across RGB and normalized to a 1000 m far plane:
  `depth_m = 1000 * (R + G*256 + B*256^2) / (256^3 - 1)`.
- **Instance segmentation** puts the semantic tag in R and a 16-bit instance ID
  across G and B.

First, both buffers **must** be saved as lossless PNG with no color converter
applied. JPEG's lossy compression would corrupt the packed channel values and
silently break both decodes, and CARLA's depth converters are visualization
helpers that throw away precision.

Second, and this is the one that changed the design: every one of these
conventions was treated as **unverified until measured against real captures**,
and one of them did not hold. The documented reading is that the instance ID maps
to the CARLA actor ID. It does not. Vehicle pixels decode to IDs in the tens of
thousands under *both* byte orders while the actual actor IDs in those frames were
in the low hundreds — it is an engine-side ID with no route back to the Python
actor. That would have produced a silently empty visibility filter, and a dataset
where the labels look plausible and the occlusion reasoning is fiction.

So the filter was redesigned around depth instead, which answers the question that
actually matters: is anything rendered nearer than this box. Two more conventions
were pinned the same way, by making the sensors check each other. Projecting the
LiDAR sweep into the camera and comparing against the depth buffer gives a ratio of
**1.0000** for planar depth against 0.88 for radial, which settles the encoding and
confirms the intrinsics at once; the same comparison settles the LiDAR handedness
at 91-96 percent point agreement unflipped against 37-52 percent flipped. And
`rotation_y` was checked against each vehicle's recorded velocity: over 71 moving
vehicles, the heading implied by the written label agreed with the direction of
travel to a mean of **0.31 degrees**, with none flipped by 180.

None of those is visible in a label file. A wrong convention produces a
perfectly well-formed dataset, which is exactly why they get measured rather than
assumed.

</details>

<details>
<summary>Configuration as a contract</summary>

Everything that parametrizes a run lives in four JSON files with strictly
separated concerns: **how the sim runs** (server settings, world conventions,
encodings, presets), **what the ego is** (blueprint and sensor rig, static across
all scenes), **what to capture** (the scene matrix and split policy), and **run
provenance** (what actually happened, stamped at generation time). A fifth file
documents the per-frame record schema.

Two rules make this work:

- **Any key beginning with an underscore is documentation, not data**, and the
  loader strips them recursively, including inside arrays. The rationale notes
  live next to the values they explain instead of rotting in a separate doc, and
  the loader contract keeps a prose sentence from being handed to `open()` as a
  file path.
- **Every ambiguity is written down**, because each one is a silent wrong-label
  bug if left implicit: CARLA's world frame is left-handed with X forward and Z
  up, rotations are in degrees, bounding box extents are half-dimensions, sensor
  transforms are sensor-to-ego, and timestamps are simulation time rather than
  wall clock. The KITTI writer converts *from* those conventions *to* KITTI's
  camera frame, and that conversion is only correct because both sides are stated
  explicitly.

Naming follows the same discipline. `(scene_id, carla_frame)` is the real primary
key and it is also the filename: frames are written as `002_231559.png` rather than
KITTI's sequential `000000.png`. The convention buys tooling compatibility, but it
makes every filename opaque — nothing on disk says which scene or which simulation
tick a frame came from, so any inspection has to join through an index first.
Traceability won, since the loader that consumes this is mine anyway.

Because a CARLA actor ID is only unique *within an episode*, every actor also
carries a `global_actor_id` namespaced by scene. That one became load bearing
sooner than expected: it is the ground-truth track ID, and the dataset ships it
alongside the labels.

</details>

<details>
<summary>Streaming the dataset back out</summary>

The offline half never materializes the dataset. A generator streams one run's
frames behind a single interface with two sources, local disk or S3: one read pulls
a scene's records file, then a bounded thread pool prefetches sensor buffers so I/O
overlaps the caller's per-frame CPU work. Buffers are decoded inside the stream, so
raw bytes never surface to the caller. Memory stays flat because only a fixed
number of frames are ever in flight, which is what lets the same code run against
a local scratch directory or an archived run in the bucket without caring which.

The buffer list is selective. The visibility filter only needs the depth and
instance-segmentation buffers, so RGB and LiDAR are opt-in, and every extra buffer
is another GET per frame. Frames are yielded in submission order, which makes the
sanity visualization deterministic even though the filter itself does not depend
on ordering.

</details>

<details>
<summary>Surviving spot interruptions</summary>

Spot capacity reclaims are uncommon but real, and the honest analysis is that
**disk choice is not the protection**. Both the NVMe instance store and the
delete-on-termination EBS root die with the instance.

What protects the work is granularity and what gets published. Capture runs one
process per run, so a reclaim costs the run in flight rather than the set, and
completed runs stay on disk for the processing pass. The instance metadata endpoint
is polled for the interruption notice so the two minute warning finishes the current
scene. And the thing that must survive — the processed dataset — is published to a
**versioned** S3 prefix, so a republish cannot overwrite the data a model was
actually trained on. Raw is disposable by design, and that is a stated tradeoff
rather than an oversight.

</details>

<details>
<summary>The infrastructure work nobody sees</summary>

Getting CARLA to run reliably on EC2 took more debugging than the capture code:

- A **baked AMI** brings the box back in about two minutes instead of redoing
  driver, Docker, and image-pull setup every session.
- The **root volume is 120 GB**, because the Deep Learning base AMI consumes
  roughly 49 GB by itself and CARLA needs about 40 GB peak to unpack. An 80 GB
  root simply fails.
- **The instance store is not captured in an AMI.** Docker has to stay on the EBS
  root for the pre-pulled image to bake into the machine image at all.
- **The `carla` Python module will not import inside the server container.** The
  image ships eggs for Python 2.7 and 3.7 while the container's own Python is 3.6,
  and the client also needs a shared library the image lacks. So the client runs
  as a separate container on a matched Python 3.7, and both run on the host
  network so the client can reach the server port *and* the instance metadata
  endpoint for role credentials.
- **Credentials never touch the disk.** The box gets an IAM instance role for S3
  access rather than access keys, SSH is restricted to my own IP, and the CARLA
  ports have no inbound rule at all.
- A **budget alarm** was the first thing created, before any instance existed.

Verification runs cheapest first: configs load and strip locally with no GPU, then
a five-frames-per-scene subset run proves the S3 layout end to end, then the
writer and reader contract is checked by streaming that subset back and decoding
it, and only then does the full run start.

</details>

<details>
<summary>Provenance and the data card</summary>

Every run stamps a provenance block: git commit, a SHA256 of each config file as
it existed at generation time, the CARLA version the server actually reported
(checked against the pinned version, because a mismatch is a bug worth catching),
the Python version and wheel, the AMI, the region, GPU hours, estimated cost, and
any spot interruptions. The config hashes are what let me prove which exact
configuration produced which data.

The data card that ships with the dataset covers the scenario matrix, per-class
instance counts **per split** rather than in total (a class that is healthy
overall but absent from test tells you nothing on test), the split key table, the
sensor spec, a reproducibility block with the exact regenerate command, and the
sim-to-real disclaimer.

</details>

## Phase 1 by the numbers

- **14 scenes**, 300 seconds each, three maps, day and night, three traffic
  density presets.
- **8,400 frames** at 2 Hz, split 4,800 train, 2,400 validation, 1,200 test.
- **14,396 labelled objects.** Against a target of 500 to 1500 instances per
  class, every class clears it and appears in every split: `car` 9,691,
  `truck` 2,805, `van` 1,034, `motorcycle` 866.
- **Four synchronized sensor buffers per frame** plus a full label record.
- **Single-digit dollars** of spot GPU time for the capture run.

The histogram is not just a report. It scores volume and per-split coverage
**independently**, because a class can clear its total and still be unmeasurable —
a split holding seven instances yields an average precision that is noise, not a
measurement. That check is what caught validation being too thin on motorcycles
and vans, and two extra validation scenes moved those from 7 and 49 instances to
271 and 145.

<details>
<summary>What the dataset carries that KITTI does not</summary>

The label files are standard KITTI, but the format has nowhere to put three things
this project depends on, so they ride alongside in a per-frame index:

- **`ego_pose`** — position, rotation and velocity per frame. The whole delay study
  rests on scoring a stale answer against what was true when it was *consumed*,
  which is impossible unless the ego trajectory is recoverable. Raw capture is
  discarded with the instance, so if this were not published it would be gone.
- **`track_ids`** — ground-truth identity, aligned row for row with the label file.
  KITTI's detection format has no identity column, and its sixteenth field
  conventionally means confidence, so an ID written there would be silently read as
  a score by anything expecting predictions.
- **`timestamp_sim_s`** — simulation time rather than wall clock, so the timeline is
  exact and reproducible.

None of these matter for training a detector. All of them matter for the
measurement the project exists to make, and every one of them is cheap now and
expensive later: they come from raw records that live only as long as the capture
instance.

</details>

## What I am learning

**Deciding what *not* to bake in is the highest-leverage design work.** Nearly
every good decision in Phase 1 was a refusal to commit early: no visibility flag
in the raw record, no class names at capture time, no derived intrinsics stored
next to their inputs. Each one converts a decision that would have cost GPU hours
to reverse into an offline re-run that costs nothing. The cost asymmetry between
capture and processing is what should drive the schema, and that is not obvious
until you are the one paying for the instance.

**Sim data is only "free labels" until you look closely.** CARLA hands you perfect
ground truth for every actor in the world, including the ones behind a truck and
the ones behind the camera. A scene reports around 120 vehicles per frame and
roughly six survive into the labels. Turning perfect knowledge into honest labels
is most of the work, and the filter that does it has to be measured rather than
reasoned about — the version I designed first was built on a documented
relationship that turned out not to exist.

**Ceilings are worth measuring before you spend against them.** Speed-limit signs
were a scoped output until I surveyed what the maps actually contain: 59 signs in
one town, 18 in another, none in a third, and one posted value represented by two
signs in the entire map. Instances scale with route density, duration, visibility
range and capture rate, and ego speed cancels out entirely — driving slower holds
each sign in frame longer but passes proportionally fewer. The arithmetic put the
ceiling well under a trainable count, and put it lowest on the held-out map, which
is the split where a missing class does the most damage. That is a property of the
maps rather than of the pipeline, so it was settled by reading the road graph
rather than by spending GPU hours against it, and the class was dropped on the
evidence. The signs are still in the raw
records, so the decision is reversible for the cost of a re-run.

**Writing the design document first genuinely changes the code.** The capture-side
and offline-side pieces were specified as one contract before either was written,
which is why the writer's keys and the reader's keys match by construction rather
than by debugging.

**Infrastructure is the tax nobody budgets for.** The disk sizing, the AMI baking,
the Python version mismatch inside the vendor container, and the network mode
needed to reach both the simulator and the credential endpoint were each a small
problem, and together they were most of a working week. Writing a relaunch runbook
with the gotchas recorded turned that into a two minute startup instead of a
rediscovery every session.

</details>

<details>
<summary>Phase 2: Train the vehicle detector (Complete)</summary>

**YOLOv11s, COCO-pretrained**, four classes (car, truck, van, motorcycle), trained
on Town04/Town06 with Town05 held out entirely. The acceptance gate was set before
training: **per-class recall above 0.85**, with latency optimised underneath that
gate rather than traded against it.

**Run 1 (640 px)** cleared the gate on cars (0.97), trucks (0.96) and motorcycles
(0.91). **Vans failed at 0.78**, and no confidence threshold could rescue them.

**Diagnosing the van miss instead of tuning around it.** The validation set held
only **145 van labels from 13 distinct vehicles**, and most misses were far-range.
That is a data-diversity problem, not a model problem. So I wrote a targeted
capture — **387 new frames** selected for far and occluded vans and far
motorcycles — and retrained at **960 px**:

| | Run 1 (640) | Run 3 (960, + targeted data) |
|---|---|---|
| Van recall | 0.78 | **0.86** |
| Motorcycle recall | 0.91 | **0.97** |
| Macro mAP | 0.84 | **0.89** |
| Truck recall | 0.96 | 0.92 (regressed) |

Same validation frames on both sides, so the comparison is fair.

**Latency:** **8.9 ms p50 / 11.2 ms p99** per frame on an A10G, nearly flat across
FP16 and input size. That says the model is **overhead-bound, not compute-bound**
on a big GPU — and also that it says nothing yet about an Orin Nano, where compute
dominates.

**Moving on with known weaknesses, deliberately.** Whether a detector is "good
enough" is not a property of mAP; it is defined by what consumes it. So run 3 is
the perception model, and the closed-loop comparison against ground truth
(Phase 3) decides whether it needs more work. Carried forward: the truck
regression, weaker recall at 60–80 m, and the van gate only being met at a very
low confidence threshold.

</details>

<details>
<summary>Phase 3: Closed-loop highway cruise control, on the edge (In progress)</summary>

Lane keeping plus distance keeping, as a production smart-cruise system does, in
**ROS 2 C++**: YOLO + LiDAR 3-D boxes, EKF tracking, lane detection, then a classic
planner and controller. Edge target is a **Jetson Orin Nano**.

- **Operating domain v1:** clear weather, daytime, low to high traffic, all maps.
- **Done:** more than **5 minutes of continuous driving with no failure**.
- **Failure:** a collision, leaving the lane, not holding speed or gap, or
  accelerating just because the lead vehicle did.
- **Scored twice:** once with ground-truth boxes, once with YOLO. The difference
  is the detector's cost.

</details>

<details>
<summary>Phase 4: Make it cloud-native and find the limits (Planned)</summary>

Move perception to AWS and run the same closed-loop scenarios. The latency budget
can only be set once the whole system exists, so it is measured here rather than
guessed up front. The expected outcome is finding *where* cloud perception stops
being safe to drive on for a highway.

</details>

<details>
<summary>Later: city driving, cloud-assisted (Planned)</summary>

If the highway case shows cloud inference cannot keep up, the domain moves to city
driving, where lower speeds widen the latency budget — using **Bench2Drive** for
closed-loop scenarios (cut-ins, merges, emergency braking) and a cheap on-board
signal that decides when a cloud call is actually needed.

</details>

## Keeping it honest

Everything here is simulator-trained and simulator-labeled. Results are reported
as sim results, and real-world performance is stated as untested rather than
implied. Overclaiming sim-to-real transfer is the fastest way to lose a good
engineer's trust, and the measurement study only means anything if the numbers
behind it are described exactly as far as they actually go.
