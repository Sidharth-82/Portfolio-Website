---
name: AWS
level: Intermediate
category: Cloud & Infrastructure
icon: "☁️"
featured: True
order: 21
aliases: ["EC2", "S3", "IAM"]
courses: []
#   - title: "TODO: e.g. an AWS course or certification"
#     provider: "TODO: provider"
#     link: https://example.com
#     summary: "TODO: what this covered."
#     certificates: []
---

Cloud infrastructure for ML workloads, learned by paying for it. Everything
below comes from running the Phase 1 data-generation pipeline of the
[Cloud-Native AV Perception Stack](/projects/#carla) — GPU rendering that could not run on my own hardware had to run in the cloud, cheaply.

- **EC2** — GPU capture on `g4dn.xlarge` **spot** instances at roughly
  $0.15–0.20/hr against $0.53 on demand, a **baked AMI** that cuts startup from
  a full driver/Docker/image-pull setup down to about two minutes, deliberate
  root-volume sizing, and instance-store versus EBS tradeoffs. Spot
  interruptions are handled by polling the instance metadata endpoint and
  flushing partial work inside the ~2 minute warning.
- **S3** — per-scene prefixes that make a capture run idempotent and resumable,
  plus a streaming reader that processes the dataset straight out of object
  storage behind a bounded prefetch pool, so nothing is ever written to local
  disk and memory stays flat.
- **IAM & cost control** — an instance role instead of access keys on disk,
  SSH restricted to a single IP with no inbound rule at all on the simulator
  ports, and a budget alarm created before the first instance existed.

Managed ML services — SageMaker training and endpoints, ECS/Fargate or Lambda
serving, CDK or Terraform, and CloudWatch dashboards — are Phases 3 through 6
of that project and are **not** claimed yet.
