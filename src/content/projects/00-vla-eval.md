---
title: VLA Policy Evaluation Layer
summary: An evaluation harness for vision-language-action robot policies. It answers two questions a benchmark score can't — when does the policy break, and is the difference real?
image: /videos/projects/vla-eval.mp4
github: https://github.com/Sidharth-82/OpenVLA-Custom-Eval-Layer
tags: [Python, PyTorch, Machine Learning, Hugging Face, Simulation, Docker, AWS, OpenVLA, LIBERO, MuJoCo, Statistics]
featured: true
spotlight: false
status: In Progress
order: 0.5
---

<!--
COLLAPSIBLE SECTIONS: same contract as 00-carla.md. Two blank lines are
load-bearing:

  <details>
  <summary>Title</summary>
                        <- REQUIRED blank line, else the body renders as raw HTML
  markdown body
                        <- REQUIRED blank line
  </details>

MEDIA (all generated 2026-10-07 from the project's own results/ directory):
  - public/videos/projects/vla-eval.mp4 — hero. 4x2 grid of real OpenVLA-7B
    rollouts from the Step 1.5 reproduction run (results/step1_5/rollouts), 6
    successes + 2 failures, labelled. 1280x720, front-loads motion.
  - public/videos/projects/vla-eval-success-vs-fail.mp4 — same task
    ("from table center"), one success and one failure, side by side.
  - public/images/projects/vla-eval-tiers.png — success rate per tier with
    Wilson 95% CIs and exact McNemar p (numbers: Step 2 spec §7e).
  - public/images/projects/vla-eval-failures.png — failure composition per tier
    (never grasped vs every other bucket, spec §7e item 4).

NUMBERS: every figure is MEASURED, from the Step 1/2 READMEs and the Step 2
runner spec §7d/§7e. Update the Step 4–6 sections as they close.

TAGS: OpenVLA, LIBERO, MuJoCo and Statistics have no skill page and render as
plain chips.
-->

**The VLA Policy Evaluation Layer** is a test harness for vision-language-action
robot policies — models that take a camera image and a sentence ("put the bowl on
the plate") and output arm motions. It is not a model and not a training run. It is
the instrument that tells you **where a policy stops working, and whether a
difference between two numbers is real or noise.**

The policy under test is **OpenVLA-7B**, run on the **LIBERO-Spatial** manipulation
benchmark in MuJoCo, on EC2 GPUs inside a pinned Docker image.

**The headline finding:** rephrase the instruction — same scene, same task, same
meaning — and success drops from **83.6% to 71.0%** across 500 paired episodes
(exact McNemar **p = 3.1e-7**). The drop is not gradual. Swapping single words barely
moves it; changing sentence structure takes almost all of it at once.

## The question this project answers

Robot-policy benchmarks report one number: success rate on a fixed task suite. That
number tells you a policy works. It doesn't tell you:

1. **Under what change does it degrade?** v1 perturbs the *language* half of the
   model — a paraphrased instruction in an unchanged scene. That separates real
   language grounding from pattern-matching on the scene, and the standard
   benchmark barely probes it.
2. **Is the delta real?** Every success rate here carries a **Wilson confidence
   interval**, and every comparison is **paired** — the same 500 initial states run
   under every condition — so a single flipped episode has exactly one candidate
   cause.

**No training happens in this project.** It is inference-only by design: failures
are cheap, fast to rerun, and the output *is* the product.

<video src="/videos/projects/vla-eval-success-vs-fail.mp4" autoplay muted loop playsinline controls></video>

## System shape

- **Pinned environment.** A Dockerfile that rebuilds the exact environment the
  published numbers came from. Reproducing it meant pinning four packages the
  original authors never pinned — a protobuf conflict, a MuJoCo 2→3 binding change,
  and a NumPy 1→2 ABI break that silently kills `torch.from_numpy()`.
- **Scenario spec.** One YAML file per run. Seeded, versioned, and resolved into a
  self-contained run directory that's interpretable without the repo.
- **Perturbation objects.** The runner takes an object that *transforms the
  scenario spec* and knows nothing about paraphrasing. A new axis (pose jitter,
  distractor objects) is a new module plus a config — never a rewrite of the run
  loop. That is the line between an eval *layer* and an eval *script*.
- **Dense instrumentation.** Beyond pass/fail, every step records end-effector pose,
  gripper state, distance to target, grasp and lift flags — **~250,000 step rows**
  across the sweep, so failures can be classified without rerunning anything.
- **Provenance.** Git SHA, Docker image ID, GPU name and the SHA-256 of the
  paraphrase set are stamped into every run.
- **Execution.** EC2 `g5.2xlarge` (A10G), disposable instance, results pulled back
  and the box terminated at the end of every step.

## Build stages

Each step has a pass/fail gate fixed *before* the run that tests it, so the gate
can't be moved to fit the result.

<details>
<summary>Step 1: Reproduce the published baseline (Complete)</summary>

For an eval harness, **"the policy is bad" and "my harness is broken" look
identical** without a ground truth. So before measuring anything new, the harness
had to reproduce the number OpenVLA's authors published.

```
418 / 500 = 83.6%       published: 84.7 ± 0.9% (n=1500, A100)
gap  1.1 pp             gate ±5.0 pp   →   PASS
Wilson 95% CI  [80.1%, 86.6%]
```

The ±5 pp gate was derived from the standard error of both runs, combined in
quadrature, *before* the run. The derivation predicted a confidence interval about
6.3 pp wide; the observed interval was 6.5 pp — the statistical model of the
experiment was right to within 0.2 pp.

Stated precisely: this result is *consistent with* the published baseline, not
identical to it. It's a failure to reject, not proof of equality.
</details>

<details>
<summary>Step 2: The custom runner, and proving it matches (Complete)</summary>

The custom runner only earns the right to replace OpenVLA's reference script if it
produces the same answer. A second equivalence gate was fixed before the run
(±4.59 pp, from two n=500 proportions).

The runner returned **418 / 500 — a 0.00 pp difference, and 500 / 500 agreement at
the level of individual episodes.**

That matters more than the matching rate. Two implementations can hit the same
aggregate through errors that cancel; they can't produce 500 identical binary
outcomes by accident. Seven conventions between observation and action — crop,
resize, prompt format, detokenisation, un-normalisation statistics, gripper sign,
settle steps — are verified jointly.

It also measured the noise floor: with identical inputs on matched hardware, **0 of
500 episodes flipped.** So in the sweep that follows, any flipped episode is caused
by the instruction change and nothing else.
</details>

<details open>
<summary>Step 3: The paraphrase sweep (Complete)</summary>

Four instruction tiers per task, written against explicit validity rules,
version-controlled and hash-pinned:

| Tier | Rule | Example |
|---|---|---|
| 0 control | Benchmark's own wording | *pick up the black bowl from table center and place it on the plate* |
| 1 lexical swap | Single-word synonyms only | *grab the black bowl from the middle of the table and put it on the plate* |
| 2 verb + structure | New verbs, relative clauses | *lift the black bowl that is positioned at the center of the table and set it onto the plate* |
| 3 natural rephrase | Free rewording, same meaning | *the black bowl in the middle of the table needs to go onto the plate* |

10 tasks × 4 tiers × 50 trials = **2,000 episodes, 31.9 GPU-hours.**

![Success rate per paraphrase tier with Wilson 95% confidence intervals](/images/projects/vla-eval-tiers.png)

**What the data shows:**

- **The drop is a step, not a ramp.** Tier 1 → 2 loses 8.4 pp (p = 2.9e-4). Tier 2
  → 3 loses 1.0 pp (p = 0.74). Almost the whole effect lands at the first tier that
  changes sentence structure.
- **Tier 1 barely moves the rate but flips 23% of episodes.** Single-word swaps
  changed the outcome of 114 of 500 episodes — 49 got better, 65 got worse. The net
  change isn't significant; the *sensitivity* is large. Those are two different
  quantities, and a single success rate hides the second one.
- **249 of 500 episodes change outcome at least once** across the four tiers.
- **The extra failures are almost all "never grasped".** Successes look the same at
  every tier. What grows is episodes where the arm never gets the bowl.

![Failure composition per tier: never grasped versus all other failure modes](/images/projects/vla-eval-failures.png)

Per task, the effects are sharp: *"from table center"* went **40 → 33 → 30 → 13**
successes out of 50, the largest drop in the sweep. One task went the other way — a
single synonym swap took it from 39/50 to **50/50**.
</details>

<details>
<summary>Step 4: Failure taxonomy (Next)</summary>

Auto-classify every failed episode — grasp miss, wrong object, transport, release,
drift — from the dense step data that's already on disk. No GPU needed; the input
data (2,000 episodes, ~250k step rows) already exists.
</details>

<details>
<summary>Step 5: Slices and statistics (Not started)</summary>

Success rate per slice with Wilson CIs and paired McNemar tests across tiers,
written up so "is this delta real?" has an honest answer — including disclosure of
the multiple-comparisons decision.
</details>

<details>
<summary>Step 6: Regression report (Not started)</summary>

Two policy versions (full-precision vs 4-bit quantized OpenVLA), one command, one
HTML report.
</details>

## By the numbers

Every figure here is measured.

- **2,500 evaluation episodes** run end to end (500 reproduction + 2,000 sweep);
  the sweep alone was **31.9 GPU-hours** on A10G.
- **83.6% vs 84.7%** published baseline — inside a ±5 pp gate fixed before the run.
- **500 / 500** episode-level agreement between the custom runner and the reference
  script; **0 / 500** flips under identical input.
- **83.6 → 80.4 → 72.0 → 71.0%** across paraphrase tiers; tiers 2 and 3 significant
  at **p ≈ 1e-6**, tier 1 not (**p = 0.16**).
- **114 / 500** episodes flipped by single-word synonym swaps alone.
- **~250,000** instrumented step rows; **40** reviewed, hash-pinned instruction
  strings.

## What I am learning

**Reproduce before you measure.** Without a truth anchor, a broken harness and a
bad policy produce the same output. Matching the published number first is what
makes every later number mean something.

**Fix the threshold before you see the result.** Every gate in this project was
derived and written down before the run it judged. A pass is easiest to quietly
widen exactly when it's close — so the decision has to exist first.

**Matching rates isn't the same as matching behaviour.** 418/500 twice could be
coincidence. 500 identical episodes can't be — that's the difference between
"consistent on average" and verified.

**Sensitivity and degradation are different things.** Tier 1 barely changed the
success rate but flipped nearly a quarter of the episodes. A single headline number
would have called it harmless.

**The environment drifts even when the code doesn't.** The published code was fine;
four unpinned dependencies had moved underneath it. An eval harness should own a
thinner dependency surface than the training repo it evaluates.

## Keeping it honest

- **Simulation only.** LIBERO runs in MuJoCo. No real-robot claim is made.
- **One axis.** v1 perturbs language only. Camera and object-pose perturbations are
  planned, strictly one at a time.
- **One sentence per tier per task.** Each per-task cell is one specific string over
  50 episodes — an observation about that sentence, not about the tier in general.
- **The paraphrase set was written by the person expecting to find degradation.** It
  ships version-controlled and hash-pinned so the finding can be checked against
  exactly what was tested.
- **The multiple-comparisons correction was decided after the results were read.**
  Every tier's verdict is the same with no correction and with the most conservative
  ×3 correction, so it doesn't change the conclusion — but it's disclosed as post-hoc.
- **Same-hardware reproducibility only.** The 500/500 agreement holds on one GPU
  type and one image. It's not a determinism guarantee across hardware.
