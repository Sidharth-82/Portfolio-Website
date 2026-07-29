---
title: Cloud-Native AV Perception Stack (CARLA + AWS)
summary: A highway perception stack split across an onboard real-time tier and an AWS near-real-time tier, built to measure whether delayed cloud perception is still safe to act on.
image: /videos/projects/carla-demo.mp4
# github: https://github.com/Sidharth-82/your-carla-repo
tags: [Python, CARLA, AWS, Docker, Computer Vision, PyTorch, ONNX, MLOps]
featured: true
spotlight: true
status: Phase 2 of 7
order: 0
---

<!--
MEDIA TODO: `image:` still points at /videos/projects/carla-demo.mp4, which does
not exist yet. Until the clip lands in public/videos/projects/ the tile shows an
empty black box. Best candidates for the hero clip, in order:
  1. A drive with tracked vehicle boxes + lead distance + detected speed limit
     overlaid live (this is the Phase 5 money shot).
  2. Phase 1 sanity-viz: projected 3D boxes rendered onto captured frames.
Extra media inside the write-up: `![alt](/images/projects/carla-*.png)` for
images (click to zoom), raw `<video src="/videos/projects/*.mp4" controls
playsinline></video>` for clips. Paths are root-relative to /public.

TAGS: "CARLA", "AWS", "ONNX" and "MLOps" have no matching skill yet, so those
chips are not clickable. Add "CARLA" to the `aliases` of
src/content/skills/15-simulation.md to link that chip there.

NUMBERS: every figure in "Phase 1 by the numbers" is the configured target from
the scene matrix. Replace with the observed values recorded in
metadata.json -> runs[].results / compute once the full run is logged.
-->

**Cloud-Native AV Perception Stack** is the project I am building full time right
now. A simulated sedan drives a highway in **CARLA**, and the perception that
interprets what it sees is deliberately split across two tiers: lane geometry
runs onboard under a real-time (**<100 ms**) requirement, while vehicle detection, tracking,
lead-vehicle distance estimation, and speed-limit sign reading run in the cloud
on **AWS** under a near real-time (**<5 second**) budget.

The interesting part is not the models. It is the question the split forces you
to answer.

## The question this project answers

Real-time AI at the edge is expensive: you pay for GPU hardware in every vehicle.
Cloud or distributed inference is far cheaper per unit of compute, but it buys
that saving with latency and connectivity risk. Most portfolio projects pick a
side and move on. This one refuses to.

Instead it holds model strength fixed, runs the full-strength perception model in
the cloud, and measures the thing that actually gates deployment: **by the time a
cloud answer comes back, the world has moved.** So for every cloud output I
measure its end-to-end age and the error that age introduces:

- **Lead-vehicle distance:** the absolute difference between the distance
  reported from frame *t* and the ground-truth distance at the moment the answer
  is actually consumed, tracked against relative velocity.
- **Speed-limit signs:** a valid or stale boolean. Is the returned sign still the
  applicable one at consume time, or has the car already passed it?
- **Vehicle tracks:** IoU and box-center drift of a stale box against the current
  ground-truth box, plus track ID consistency.

Every logged point carries accuracy, age, delay-induced error, and cost, so the
usability curve is plottable rather than argued. The deliverable is a defensible
statement of **which perception outputs can honestly live in the cloud tier and
which must stay onboard**, with a stated usability threshold and the percentage
of frames each delayed output stays usable. Degrading the model for speed is a
later decision that these results inform, not a shortcut taken up front.

That measurement is only possible because of a decision made in Phase 1: the
dataset carries a **fully timestamped ground-truth timeline**, so a stale output
can be scored against what was true when it was *consumed*, not when it was
*computed*.

## System shape

- **CARLA (Python client)** spawns the ego sedan plus traffic and streams a
  synchronized sensor set: front RGB camera, instance-segmentation camera, depth
  camera, 64-channel LiDAR, IMU and GNSS.
- **Onboard tier** handles lane geometry locally, inside the real-time budget.
- **Ingestion layer** carries frames up to AWS. Transport choice (direct HTTP
  versus a streaming layer such as Kinesis or MQTT) is a Phase 5 decision.
- **Cloud inference service** runs detect, then track, then lead-distance
  estimation, and returns structured results.
- **Results return to the simulator** for live overlay, and telemetry goes to a
  monitoring dashboard measuring latency, throughput, and drift.
- **Offline path, built first:** CARLA writes raw capture to S3, offline
  processing turns it into a labeled KITTI-format dataset, cloud training
  produces a versioned model artifact, and that artifact is what gets served.

## Build phases

The project runs as seven phases, each with an explicit definition of done. I
write the phase document first, argue with it, lock the decisions, then write
code against it. The phase documents are the design record.

### Phase 0: frame the problem, lock the narrative. Complete.

Objective: decide the exact perception task and the story before writing a line
of code. The pitfall here is picking a scope so broad you can never call it
finished, so this phase ends in hard locks:

- **Setting:** highway only. **Ego:** a sedan, fixed across every run.
- **Hero outputs:** vehicle detection with tracking and lead-vehicle distance,
  plus speed-limit sign detection with value classification. Lane geometry is the
  onboard real-time counterpart.
- **Scope fence:** perception ends after those outputs. Driving behaviour and
  control are explicitly deferred to Phase 5, which kills the most likely source
  of scope creep before it starts.
- **Definition of complete is quantitative**, not vibes: baseline accuracy targets
  met, plus, per cloud output, a logged p50 and p95 end-to-end age and a
  quantified delay-induced error against relative speed.

### Phase 1: stand up the simulator and generate the dataset. Complete.

Objective: a reproducible pipeline that turns N scenario configs into a stored,
labeled dataset with a data card describing it. This is the phase that is
finished, and the section below covers it properly.

### Phase 2: build and validate the model locally. In progress.

Objective: a working detector on my own data before touching cloud training.
Open decisions: which model family, justified on accuracy versus latency versus
memory; transfer learning versus training from scratch; camera-only for v1, with
camera plus LiDAR fusion held back as the stronger but costlier story. Metrics
are mAP for detection, MAE in meters for lead distance, and MOTA and IDF1 for
tracking. Done when the model beats a defined baseline on the held-out map and I
can render qualitative overlays. The pitfall is chasing state-of-the-art accuracy
instead of a clean, reproducible pipeline, so the baseline gets defined before
training starts.

### Phase 3: move training to the cloud, reproducibly.

Objective: training that runs on AWS with tracked artifacts and versioned data.
Decisions: managed training versus raw EC2 GPU with my own scripts, convenience
against control; experiment tracking with MLflow or Weights and Biases; a
containerized training job; spot versus on-demand as a cost decision.

### Phase 4: serve the model as a real inference service.

Objective: an endpoint that takes a frame and returns structured perception
results inside a latency budget defined up front. Decisions: SageMaker real-time
endpoint versus a container on ECS or Fargate versus Lambda for a light model,
weighed on latency, cost, and cold start; synchronous or async; ONNX conversion
and quantization with a *measured* latency improvement rather than a claimed one;
the API contract; autoscaling.

### Phase 4b: the edge variant.

Objective: deploy the *same* ONNX-optimized model to a constrained second target,
the Raspberry Pi I already own from the Path Following Robot build, and benchmark
it head to head against the cloud endpoint on an identical test set. The output is
one comparison of latency, throughput, memory footprint, and accuracy for one
model on two targets, plus the crossover point: at what network latency does edge
beat cloud. Timeboxed hard, because this is the stretch goal most likely to turn
into its own project.

### Phase 5: close the loop.

Objective: CARLA and AWS talking in real time, with the simulator streaming
frames out, getting perception back, and doing something visible with it.
Decisions: transport, how much feedback (visualize detections live, or actually
influence the vehicle), handling of network latency and dropped frames, and the
frame-rate budget I can genuinely hit. This is also where the measurement study
gets its real telemetry: staged timestamps for capture, encode, upload, inference
start and end, download, and consumption.

### Phase 6: MLOps polish.

Monitoring (latency, throughput, confidence drift, error rates) on a CloudWatch
dashboard, infrastructure as code in Python CDK or Terraform, CI that runs tests
and deploys on push, and automated teardown so the project does not quietly bleed
money. The pitfall is over-engineering, so this phase is scoped to the parts that
actually demonstrate production maturity.

### Phase 7: demo, docs, and the story.

A 60 to 90 second hero clip, an architecture diagram, the metrics, a design
decisions and tradeoffs note, and a README that tells the whole story. A great
project made invisible by a weak README is the failure mode here.

## Phase 1 in depth

Phase 1 is done, and it is where most of the engineering judgement lives so far.

### Splitting the pipeline so the GPU is only up when it must be

CARLA is an Unreal Engine renderer. Even headless, the cameras and LiDAR are
GPU-rendered, so there is no running it on a laptop without an NVIDIA GPU. I do
not have one, so CARLA runs on an **EC2 g4dn.xlarge spot instance** (T4, 16 GB) in
us-east-1, at roughly 0.15 to 0.20 USD per hour instead of 0.53 on demand.

That makes GPU time the scarce resource, so the pipeline is split by what
genuinely needs a GPU:

- **On the GPU box:** drive the scenarios and dump *raw* output. Camera images,
  LiDAR points, every actor bounding box and transform, sensor calibration, ego
  pose, and the weather, map, and time tags. Then stream it to S3 and terminate.
- **Offline, on CPU, for free:** project boxes into 2D and 3D, run the occlusion
  and in-frustum filter, attach sign labels, package to KITTI, assign splits, and
  write the data card.

Slower in wall-clock terms, dramatically cheaper, and it means every offline
decision is re-runnable without ever going back to the GPU.

### Raw capture, filtered later

The capture-side records are deliberately **unfiltered**. Every actor CARLA
reports gets written, including ones that are occluded or outside the frustum,
and the per-frame record schema has no `visible` field at all. Visibility is a
derived property computed offline, so baking one filter threshold into data that
costs GPU hours to regenerate would be an expensive mistake to undo.

The same principle drives the class map. Each object records its `blueprint_id`,
`base_type`, and `listed_speed_kph`, and the dataset class name is applied by the
KITTI writer, not at capture time. That makes the class list a **config knob**: a
`fine` preset gives seven classes (car, truck, van, motorcycle, and a class per
posted speed value) and a `coarse` preset collapses all vehicles into one. If the
per-class histogram shows motorcycles starved on a highway, flipping the preset
and re-running the writer costs nothing. Record fine-grained, decide coarse later.

### The scenario matrix and the split that actually tests generalization

Twelve scenes, 300 seconds each, sampled at **2 Hz** from a 20 Hz simulation.
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

### Determinism as a hard requirement

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

### The sensor rig

A front-focused rig, `front_v1`, designed so five more cameras can be added later
without a schema change:

- **`cam_front`**: RGB, 1280x720, 90 degree FOV, mounted 1.5 m forward and 1.6 m
  up. Intrinsics are **derived** from width, height, and FOV rather than stored
  alongside them, because storing both invites drift.
- **`cam_front_instance_seg`**: co-located with the RGB camera so per-actor ID
  pixels line up with projected boxes. This drives the vehicle visibility filter.
- **`cam_front_depth`**: also co-located. Signs are static map objects with no
  actor instance ID, so instance segmentation cannot filter them. Their occlusion
  check compares projected distance against the depth buffer instead.
- **`lidar_top`**: 64 channels, 100 m range, 1.3 M points per second, rotation
  frequency pinned to 20 Hz so exactly one full sweep completes per tick. A
  mismatch there gives partial or duplicated sweeps.
- **IMU and GNSS** for ego state. These are explicitly *not* perception inputs;
  the detector never sees them. They exist for ego-motion in tracking.

The ego vehicle is a fixed Tesla Model 3 across every single scene. Swapping the
ego between runs would change camera height and mounting geometry, which shifts
the entire data distribution. That is a confound, not useful diversity.

### The encodings that quietly destroy a dataset

CARLA's depth and instance-segmentation cameras do not emit literal images. They
pack data into RGB channels, and reading them as ordinary images gives garbage:

- **Depth** is 24-bit, packed across RGB and normalized to a 1000 m far plane:
  `depth_m = 1000 * (R + G*256 + B*256^2) / (256^3 - 1)`.
- **Instance segmentation** puts the semantic tag in R and a 16-bit instance ID
  across G and B.

Two consequences drove real decisions. First, both buffers **must** be saved as
lossless PNG with no color converter applied. JPEG's lossy compression would
corrupt the packed channel values and silently break both decodes, and CARLA's
depth converters are visualization helpers that throw away precision. Second, the
byte order and the ID mapping were treated as **unverified until checked
empirically**: spawn one vehicle at a known position with a known actor ID,
capture a frame, read the pixels inside its projected box, and confirm the decode
matches. A ten minute check that prevents a silently empty visibility filter.

The same skepticism applied to the sign values. The plan called for 90 to 110 kph
sign variety, but CARLA speed-limit signs come from each map's OpenDRIVE
landmarks, and stock towns commonly only define 30, 60, and 90. Enumerating the
landmarks per town before locking the matrix was the difference between a designed
class list and a discovered one.

### Configuration as a contract

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

Naming follows the same discipline. Frame IDs are zero-padded so lexicographic
sort equals numeric sort, `(scene_id, carla_frame)` is the real primary key, and
because a CARLA actor ID is only unique *within an episode*, every actor also
carries a `global_actor_id` namespaced by scene. That last one becomes load
bearing the moment tracking exists.

### Streaming the dataset back out

The offline half never downloads the dataset. A generator streams one run's frames
straight out of S3: one GET pulls a scene's records file, then a bounded thread
pool prefetches sensor buffers so network I/O overlaps the caller's per-frame CPU
work. Buffers are decoded inside the stream, so raw bytes never surface to the
caller, and nothing is written to local disk. Memory stays flat because only a
fixed number of frames are ever in flight.

The buffer list is selective. The visibility filter only needs the depth and
instance-segmentation buffers, so RGB and LiDAR are opt-in, and every extra buffer
is another GET per frame. Frames are yielded in submission order, which makes the
sanity visualization deterministic even though the filter itself does not depend
on ordering.

### Surviving spot interruptions

Spot capacity reclaims are uncommon but real, and the honest analysis is that
**disk choice is not the protection**. Both the NVMe instance store and the
delete-on-termination EBS root die with the instance. The protection is **S3 flush
cadence**. Scratch stays on the fast free NVMe, each scene flushes to its own S3
prefix as it completes, and re-running a scene overwrites its prefix while
already-complete scenes are skipped, so a run is idempotent and resumable. On top
of that, the instance metadata endpoint is polled for the interruption notice, and
the roughly two minute warning is used to flush the current partial scene before
the box disappears.

### The infrastructure work nobody sees

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

### Provenance and the data card

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

## Phase 1 by the numbers

- **12 scenes**, 300 seconds each, three maps, day and night, three traffic
  density presets.
- **~7,200 frames** at 2 Hz, split 4,800 train, 1,200 validation, 1,200 test.
- **Four synchronized sensor buffers per frame** plus a full label record, at
  roughly 11 MB per frame.
- **Single-digit dollars** of spot GPU time for the capture run.
- An instance target of **500 to 1500 per class**, with the histogram deciding
  whether targeted top-up scenes are needed. Signs are the expected bottleneck,
  because you drive a long way between them.

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
the ones behind the camera. Turning that into honest labels needs a real occlusion
and frustum filter, and it needs two different mechanisms, because vehicles are
actors with instance IDs while signs are map objects that are not actors at all.

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

## Keeping it honest

Everything here is simulator-trained and simulator-labeled. Results are reported
as sim results, and real-world performance is stated as untested rather than
implied. Overclaiming sim-to-real transfer is the fastest way to lose a good
engineer's trust, and the measurement study only means anything if the numbers
behind it are described exactly as far as they actually go.
