---
title: Qwen 3 VQA Model Tuning
summary: Fine-tuned a Qwen 3 vision-language model for driving-scene question answering on NuScenes.
image: /images/projects/qwen3-vqa.svg
github: https://github.com/Sidharth-82/PyTorch-Projects/blob/main/Qwen%203/DESCRIPTION.md
tags: [Python, PyTorch, Qwen 3, VLM, LoRA, Hugging Face]
featured: true
order: 3
---

<!--
IMAGE: /images/projects/qwen3-vqa.svg is a custom-designed thumbnail (surround
cameras + LiDAR_TOP -> VLM Q&A). Optionally swap for a real screenshot once you
have one — strong options: a NuScenes 6-camera surround grid with a VQA
prompt/answer overlay, a LiDAR point-cloud render, or the training-loss curve
from the notebook (see recommendations in chat).
-->

**Qwen 3 VQA Model Tuning** fine-tunes the Qwen 3 vision-language model to perform
driving-scene reasoning, answering questions about multi-camera and LiDAR scenes
from the **NuScenes** dataset.

## Highlights

- Fine-tuned **Qwen 3** to perform driving-scene QA reasoning using camera and
  LiDAR data from the NuScenes dataset.
- Built a training pipeline with **LoRA, quantization, and Hugging Face TRL** to
  train effectively under limited GPU resources.
- Structured visual + text data into instruction-tuning prompt formats suitable
  for a VLM.

## What I learned

Working within tight GPU constraints made parameter-efficient fine-tuning (LoRA)
and quantization essential rather than optional. This project deepened my
understanding of how vision-language models ingest multimodal driving data and
how prompt structure shapes reasoning quality — directly feeding into my
autonomous-driving perception research.
