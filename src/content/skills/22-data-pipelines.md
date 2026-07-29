---
name: Data Pipelines
level: Intermediate
category: Web, Data & Tools
icon: "🗃️"
featured: false
order: 22
aliases: ["Dataset Engineering", "KITTI"]
courses: []
#   - title: "TODO: e.g. a data engineering course"
#     provider: "TODO: provider"
#     link: https://example.com
#     summary: "TODO: what this covered."
#     certificates: []
---

Turning raw capture into a dataset you can defend. Phase 1 of the
[Cloud-Native AV Perception Stack](/projects/#carla) was mostly this:

- **Split the pipeline by what actually needs a GPU.** Capture dumps raw output
  and terminates the expensive instance; projection, occlusion filtering,
  KITTI packaging, split assignment and the data card all run offline on CPU,
  so every downstream decision is re-runnable for free.
- **Record fine, decide coarse later.** Raw records carry no `visible` flag and
  no class names — visibility is derived offline and the class map is a config
  preset, so reversing either costs a re-run instead of GPU hours.
- **Splits at the scene level, never the frame level**, with the test set on a
  completely held-out map, and per-class instance counts reported *per split*
  rather than in total.
- **Provenance as a first-class artifact** — git commit, a SHA256 of every
  config file as it existed at generation time, tool versions, cost and spot
  interruptions stamped into each run, so I can prove which exact configuration
  produced which data.
- **Streaming reads over downloads** — a generator pulls frames straight from
  S3 behind a bounded prefetch pool, decoding buffers in-stream with a
  selective buffer list, since every extra buffer is another GET per frame.

The through-line: the cost asymmetry between capture and processing is what
should drive a schema, and deciding what *not* to bake in is the highest-leverage
design work.
