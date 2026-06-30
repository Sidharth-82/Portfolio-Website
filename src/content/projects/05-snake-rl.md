---
title: Snake Game Reinforcement Learning
summary: A Deep Q-Network trained in PyTorch to learn optimal control policies for the Snake game.
image: /videos/projects/Snake_video.mp4
github: https://github.com/Sidharth-82/PyTorch-Projects/blob/main/SnakeGame/DESCRIPTION.md
tags: [Python, PyTorch, Deep Q-Networks, Reinforcement Learning]
featured: true
order: 5
---

<!--
IMAGE NEEDED: Replace /images/projects/snake-rl.svg with a screenshot of the
trained agent playing, or a training reward/score curve. No image exists in the
portfolio PDF for this project.
-->

**Snake Game Reinforcement Learning** trains a **Deep Q-Network (DQN)** in PyTorch
to learn optimal control policies for the Snake game through reward-based
optimization.

![Game Score Training Graph](/images/projects/snake_graph.png)

## Highlights

- Designed and trained a **DQN** to learn control policies via reinforcement
  learning.
- Built a custom simulation environment with real-time state encoding, collision
  handling, and feedback loops for agent training and evaluation.
- Implemented **experience replay, epsilon-greedy exploration, and discounted
  future rewards** to stabilize learning and improve convergence.

## What I learned

Reward shaping and exploration/exploitation balance make or break RL convergence.
Watching the agent go from random thrashing to deliberate play was a concrete
lesson in how value estimates propagate over time.
