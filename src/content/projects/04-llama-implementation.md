---
title: Llama 3.1-8B Transformer From Scratch
summary: A from-scratch PyTorch reimplementation of Llama 3.1-8B — RMSNorm, RoPE, GQA, SwiGLU — loading Meta's real 8B weights for text generation.
image: /images/projects/llama-implementation.svg
github: https://github.com/Sidharth-82/PyTorch-Projects/blob/main/Llama%20Implementation/DESCRIPTION.md
tags: [Python, PyTorch, Llama 3, Transformers, RoPE, GQA]
featured: true
order: 4
---

<!--
IMAGE: /images/projects/llama-implementation.svg is a custom-designed thumbnail
(decoder-only transformer block: RMSNorm -> GQA -> SwiGLU with residuals, ×32).
Optionally swap for a real screenshot — e.g. a generated text-completion sample,
the architecture diagram from the notebook, or the shape-test output.
-->

**Llama 3.1-8B Transformer From Scratch** reimplements Meta's **Llama 3.1-8B**
decoder-only language model **from first principles in PyTorch**, then loads the
official pretrained weights into the custom architecture to run real text
generation. The goal is educational: to understand every component of a modern
transformer by building it piece by piece rather than calling a high-level
library.

## Highlights

- Built the full **Llama 3.1-8B** architecture from scratch — **RMSNorm**,
  **Rotary Position Embeddings (RoPE)**, **Grouped-Query Attention** with a
  **KV cache**, and the **SwiGLU** feed-forward network.
- **Shape-tested each component in isolation** (RMSNorm, RoPE, FFN, attention,
  block) before assembling the 32-layer model.
- Matched Meta's official hyperparameters (Llama 3 paper, Table 3): dim **4096**,
  FFN **14336**, **32 layers**, **32 query / 8 KV heads**, RoPE θ **500000**,
  vocab **128256**.
- Loaded the official `consolidated.00.pth` checkpoint (**~8.03B parameters**)
  into the custom `Transformer` for end-to-end inference.
- Implemented Meta's **Tiktoken BPE tokenizer** with 256 reserved special tokens
  and a `ChatFormat` helper for instruction-tuned prompts.
- Ran autoregressive text completion with **KV caching**, **temperature scaling**,
  and **top-p (nucleus) sampling**.

## What I learned

Building each block from the ground up demystified how modern LLMs actually work
— why RMSNorm and RoPE replace LayerNorm and absolute positions, how GQA trades
KV heads for memory, and how a KV cache makes autoregressive decoding efficient.
Loading 8B real weights under tight hardware limits also made the practical
trade-offs (sequence length, batch size, slow CPU checkpoint mapping) concrete.
