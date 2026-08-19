---
label: May
sublabel: "2027"
order: 10
---

**Tier 3 · Deployment — real-time C++ inference.** Tier 1–2 produced models that
run in a Python notebook. This tier answers the harder question: does any of it
hold up as a real-time C++ node on hardware I can touch?

- **Export & port:** take the strongest Tier 2 model, export to **ONNX**, and
  write the inference wrapper in **C++** (ONNX Runtime, TensorRT if the hardware
  supports it) — pre/post-processing included, not just the forward pass.
- **Wrap as a ROS2 node:** publish detections on a proper message type, with
  parameters, lifecycle handling, and a launch file.
- **Set a latency budget first, then measure against it:** end-to-end
  sensor-to-detection latency, throughput, and memory ceiling. *Ablation:* model
  size / input resolution vs. latency vs. miss rate — pick the operating point on
  evidence, not by feel.
