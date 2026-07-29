---
name: Docker
level: Intermediate
category: Cloud & Infrastructure
icon: "🐳"
featured: false
order: 17
aliases: []
courses: []
#   - title: "TODO: e.g. Docker course"
#     provider: "TODO: provider"
#     link: https://example.com
#     summary: "TODO: what this covered."
#     certificates: []
---

Containerizing reproducible robotics and ML environments so a build behaves the
same on my laptop, a robot, and a cloud instance.

The sharpest example is the
[Cloud-Native AV Perception Stack](/projects/#carla), where the CARLA simulator
and its Python client run as **two containers on one EC2 host**. They have to:
the vendor image ships Python 2.7 and 3.7 eggs against its own 3.6 interpreter
and is missing a shared library the client needs, so the client runs separately
on a matched Python 3.7. Both use **host networking** so the client can reach
the simulator port *and* the instance metadata endpoint for role credentials,
and the server image is pre-pulled into a baked AMI — which forces Docker onto
the EBS root volume, because the instance store is not captured in an AMI.

Also used for reproducible ROS2 workspaces and the UWB tracking system's
backend services.
