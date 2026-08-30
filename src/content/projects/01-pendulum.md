---
title: Learned Swing-Up for an N-Link Pendulum
summary: An N-link pendulum on a belt-driven cart, written in C++ end to end — dynamics, an LQR baseline, and a hand-written PPO — built so the simulator can be trusted enough to buy hardware against.
image: /videos/projects/pendulum.mp4
github: https://github.com/Sidharth-82/RL-Pendulum-Balance
tags: [C++, Reinforcement Learning, Control Theory, PyTorch, Eigen, MuJoCo, CMake, Robotics, Simulation, Numerical Methods]
featured: true
spotlight: false
status: Simulator Finished
order: 1
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

`<details open>` expands one by default; "The plant, and proving it right" is the
one currently open.

MEDIA: unlike the CARLA page, the clip already exists. `docs/media/policy-final.mp4`
in the repo is an 8 s 960x540 render of the trained policy driving MuJoCo closed
loop. Copy it to public/videos/projects/pendulum-demo.mp4. It is already 16:9 and
front-loads the payoff (swing-up completes at 0.4 s), which suits the muted,
looping, reset-on-mouse-leave tile.

Four more clips exist at docs/media/policy-iter{0,30,70,190}.gif — the training
progression. Good for an inline strip further down the page if the layout allows.

TAGS: check these against skills/ before publishing. "PyTorch" is the tag that
should resolve for LibTorch work; "Control Theory" and "Numerical Methods" may
need skill pages or should be dropped to plain chips. "Robotics" overlaps with
whatever backs the Path Following Robot entry.

NUMBERS: unlike 00-carla.md, every figure on this page is MEASURED, not a target.
Sources: tests/ output for the validation figures, train_log.csv for the RL
figures, tools/compare_mujoco.py for the cross-engine figures, and
baseline/ envelope_report for the LQR and hardware figures. The one exception is
the hardware spec itself, which is a derived requirement, not a purchase.
-->

**Learned Swing-Up for an N-Link Pendulum** is a control project and a C++ project
in equal measure. A chain of unactuated links hangs from a cart on a **2 m rail**,
and the only thing the controller can do is accelerate the cart. From hanging, at
rest, a neural network learns to throw the links over the top and hold them
upright — swing-up and balance as **one continuous behaviour**, with no trajectory
optimiser, no mode switching, and no handoff logic.

At one link it works: **3,824.9 of a 4,000 reward ceiling**, upright in **0.31 s**,
held to **0.015°**, first solved at **120 training iterations** on a CPU.

Those figures come from a single reproduction run with the committed config and a
fixed seed, and are regenerated from its logs rather than transcribed — the full
report is [in the repo](https://github.com/Sidharth-82/RL-Pendulum-Balance/blob/main/docs/training-report.md).

Everything is custom — the dynamics, the LQR baseline, and PPO itself. No RL
framework, no physics engine in the loop.

## The question this project answers

The interesting question is not "can RL balance a pendulum." That was settled
decades ago, and there is a working triple-pendulum rig from **2011 with no
learning in it at all**.

The question is: **how much do you have to prove about a simulator before you are
willing to spend money against it?**

Because that is what this project actually outputs. There is no rig yet. The
motor, the belt, the encoders and the rail length are all *derived* — by driving
the simulated plant to the edge of its stability envelope and reading off the belt
force it demanded. That number says a 400 W servo and rules out the open-loop
stepper the project started with.

A specification is only worth as much as the simulator that produced it, so the
validation is the deliverable as much as the controller is:

- **The dynamics are checked three independent ways**, then a fourth way against
  an engine that shares none of the derivation.
- **The simulation models the hardware envelope, not ideal physics** — force that
  droops with speed, step loss, encoder quantisation, sensing latency, and a
  controller that only ever sees the cart position it has dead-reckoned.
- **A classical LQR baseline runs first**, so "is this plant even stabilisable
  inside the actuator envelope" is answered by a Riccati solve rather than by a
  training run that quietly fails to converge.

The honest scope: N=1 is solved, N≥2 is not attempted yet, and nothing has touched
hardware.

## System shape

- **`core/`** — the plant, the actuator and sensor models, and a state-feedback
  controller. Eigen only, no other dependencies, because this is the half that
  cross-compiles to a Raspberry Pi.
- **`baseline/`** — linearise the plant by finite differences, solve the discrete
  Riccati equation, report the recoverable envelope.
- **`sim/`** — the RL environment: observation, reward, termination, and the
  decimation that runs the policy at 100 Hz over a 500 Hz plant.
- **`rl/`** — actor-critic networks, a GAE rollout buffer, and PPO, on LibTorch.
- **`config/`** — one JSON file describing every hardware and run number, behind a
  loader that refuses to apply a default.
- **`tools/`** — MuJoCo: a model generated from that same config, a replay viewer,
  a cross-engine comparison, and a closed-loop rollout that drives MuJoCo from
  exported policy weights.
- **`pi/`** — the real-time loop. A stub, waiting on hardware it deliberately
  links `core/` alone to serve.

The trained policy reaches the Pi as **exported weights**, not as a LibTorch
dependency. LibTorch on ARM is a heavy runtime with allocation behaviour you do
not want inside a loop holding 500 Hz.

## Build stages

Each stage below has a definition of done, and later stages are honest about being
unstarted.

<details>
<summary>Stage 0: Decide what the plant actually is (Complete)</summary>

The single most consequential modelling decision, and it is not obvious.

**The carriage is a prescribed-motion boundary condition, not a free body.** A belt
drive is commanded in acceleration, so the cart's motion is an *input*, and the
belt force needed to enforce it falls out of the solve as an *output*. Model the
cart as a free mass being pushed and you get a different set of equations, a
different mass matrix, and no natural way to ask "is the motor strong enough."

That choice pays off immediately: the belt force that comes back out is exactly
what a step-loss check tests against, and step loss is the dominant sim-to-real
failure mode for an open-loop drive.

Two other locks:

- **N is a parameter, not a constant.** The dynamics, the controller, the LQR
  design and the RL observation all generalise over link count up to a compile-time
  maximum of six.
- **The only control input is carriage acceleration.** No joint is actuated. That
  is what makes swing-up genuinely underactuated and not a servo problem.

</details>

<details open>
<summary>Stage 1: The plant, and proving it right (Complete)</summary>

Objective: N-link dynamics that can be trusted, with the trust demonstrated rather
than asserted. This is where most of the engineering judgement lives, so the
decisions below are expandable.

## Stage 1 in depth

<details>
<summary>The equations, and why the mass matrix shape matters</summary>

The chain reduces to one matrix equation:

    A(θ) α = g (h ⊙ sin θ) − a (h ⊙ cos θ) − C(θ) (ω ⊙ ω) + Q

where `a` is the commanded carriage acceleration and `Q` carries joint damping.
`A` is a mass matrix, so it is symmetric positive definite by construction — which
means it should be solved with an **LDLT factorisation, not a general LU**. Using a
general solver is not wrong so much as an admission that you did not notice the
structure.

The trigonometry is evaluated once per link and the differences expanded through
the angle-subtraction identities rather than calling `sin` and `cos` per matrix
entry. At three links that is **6 transcendental calls instead of 18**, and the
transcendentals dominate the function that the whole training run calls millions
of times.

Integration is **RK4 at 500 Hz**. Euler was rejected on a control argument rather
than an accuracy one: an integrator that injects energy makes an inverted pendulum
*easier* to stabilise than the real thing, so gains tuned against it transfer
wrong.

</details>

<details>
<summary>Storage: runtime N without touching the heap</summary>

"Modular in the number of links" and "no allocation in the hot loop" look like they
conflict. Three options:

- **Templated on N** — stack allocated and fastest, but N becomes compile-time and
  every link count needs explicit instantiation.
- **`MatrixXd`** — runtime N, simplest, and heap allocation inside a loop called
  millions of times.
- **`Matrix<double, Dynamic, Dynamic, 0, MaxN, MaxN>`** — runtime size, compile-time
  *maximum*, storage is a fixed inline array.

The third. Less well known, and it satisfies both requirements at once: N stays a
runtime value while nothing in the integration loop allocates.

</details>

<details>
<summary>Three tests that each close a hole the others cannot see</summary>

The validation is layered on purpose, and the layering is the point.

- **The N=1 closed form.** At one link the angular acceleration reduces to
  `α = (3/2L)(g sin θ − a cos θ)`, derivable by hand. This is the only test that
  pins the **absolute scale** of the inertia terms — energy conservation is
  invariant to a common factor across them, so it can be perfectly satisfied by a
  plant that is uniformly wrong.
- **Energy against geometry.** `Plant::energy` is checked against a second
  implementation written from link geometry rather than from the derivation:
  **6.2e-16 over 1200 random states**. This is the only check on the routine that
  assembles the inertia terms.
- **Conservation under integration.** With damping and carriage acceleration zero,
  total energy must not move: **~5e-9 relative at N=3**, with deliberately
  dissimilar links so the cross terms are exercised. RK4's fourth-order behaviour
  confirmed at **14× on halving the timestep**.

Belt force gets its own check, via the work-energy theorem, with an O(dt²)
convergence test rather than a fixed tolerance.

**The suite was mutation-tested**, and it caught the test suite being too weak:
deleting the damping reaction term still passed an "energy must not increase"
check, because removing energy is not the same as removing it *correctly*. That
check was replaced with a quantitative comparison against the damping integral.

</details>

<details>
<summary>The hardware envelope, which is most of the value</summary>

Ideal physics is the easy part. The models that decide whether this transfers are
the unglamorous ones:

- **Force droops with speed.** Available force is flat to a knee and falls off
  above it, because back-EMF eats torque. Pretending force is speed-independent
  makes a simulated motor look far stronger than the real one exactly where it
  matters.
- **Step loss is a termination, not a penalty.** An open-loop drive commanded past
  its envelope silently desynchronises, and the controller's belief about position
  diverges from reality with **no correction path**. There is nothing to trade
  against, so the policy has to learn to stay inside the envelope rather than to
  price its way out.
- **The cart is never measured.** No sensor observes it. Position comes from
  dead reckoning — counting the pulses that were emitted — which is exact right up
  until steps are lost. The controller sees that belief, never the truth.
- **Encoders quantise, lag, and need differentiating.** Angles arrive quantised to
  a 14-bit count, delayed, and rates come from a filtered backward difference. The
  filter corner is the most consequential number in that struct: without it, a
  derivative gain is tuned against a clean signal that does not exist on hardware.

A bug found here is representative. `Plant::step` integrates position as
`x += ẋ·dt + ½a·dt²` while the actuator used `x += ẋ_new·dt`. Those differ by
`½a·dt²` **every step**, so the dead-reckoned belief drifted from truth with no
step loss involved — quietly breaking the one invariant the actuator's own
documentation claimed. Fixed to trapezoidal and locked by a test running 2,000
random commands.

</details>

<details>
<summary>Checking the derivation against an engine that shares none of it</summary>

Everything above validates the plant against *itself*. `Plant::energy` and
`Plant::accel` were written from the same derivation, so a misread convention that
is self-consistent passes all of it.

So the model is also generated as a **MuJoCo MJCF from the same config file**, and
both engines are driven with the same prescribed carriage acceleration. MuJoCo
builds its mass matrix with composite-rigid-body and its bias force with recursive
Newton-Euler, straight off that MJCF. The two share nothing but the config.

Driving the cart needed care. `core::Plant` prescribes acceleration; MuJoCo has no
such joint. A stiff position servo tracks with a lag that looks exactly like the
error the test exists to find, so the required force is solved from **MuJoCo's own
mass matrix** instead, which holds the constraint to **1.5e-16 m/s²**.

The comparison is judged on **convergence, not raw error**. The engines hold
different quantities constant across a step — MuJoCo a force, `core::Plant` an
acceleration — a first-order difference that vanishes as the step shrinks, and a
driven pendulum then amplifies whatever seed it leaves. Refining the step is what
separates discretisation from a wrong model:

| | error at 0.2 s | 16× finer | ratio | |
|---|---|---|---|---|
| as generated | 1.4e-4 | 9.3e-6 | **15.4** | agrees |
| inertia +10% | 2.0e-2 | 2.0e-2 | 1.0 | caught |
| centre of mass moved 15 mm | 4.7e-2 | 4.7e-2 | 1.0 | caught |
| link mass +10% | 1.8e-2 | 1.9e-2 | 1.0 | caught |
| hinge axis flipped | 6.7e-1 | 6.7e-1 | 1.0 | caught |

Four errors were planted deliberately to confirm the check can fail. A validation
tool that cannot fail is decoration.

</details>

</details>

<details>
<summary>Stage 2: The classical baseline (Complete at N=1)</summary>

Objective: answer "is this plant stabilisable at all inside the actuator envelope"
from a solve rather than from a training run.

The state is augmented to `[x, ẋ, ∫x, θ, ω]` so the mapping to the gain vector is
the identity and no call site carries an index offset. `A` and `B` come from
**central-differencing the integrator itself** rather than from an analytic
Jacobian — no matrix exponential, no second derivation to keep in sync, and the
linearisation is automatically of the model the controller actually faces, RK4 and
zero-order hold included. Weights come from Bryson's rule over hardware-derived
tolerances, so a randomised actuator re-derives its own weights.

The tilt figures below were measured on an **earlier, weaker plant** — a single uniform
0.3 m rod on a 0.5 m rail with **5 m/s²** of cart acceleration — not the 30 m/s² drive the
hardware section specifies. The recoverable tilt is `acceleration ÷ angle gain`, so the
absolute numbers move with the envelope. What survives the change is the *shape*.

Two findings, both measured, both against intuition:

- **Acceleration headroom.** Pricing the step-loss boundary as merely "tolerable"
  produced gains that used the entire envelope on the opening command. Halving that
  tolerance widened the recoverable tilt from **1.6° to 2.78°**.
- **The integral weight trade is not the one you expect.** "Integral action costs
  phase margin, so loosen it" is wrong here, and a sweep says so: weakening it
  drives the integrator's own pole toward the unit circle. The real trade is
  against the angle gain. Settled at a basin of **3.32°** with zero steady-state
  error.

And the number that shapes the whole roadmap — **the difficulty cliff**, same 5 m/s²
plant:

| links | recoverable tilt |
|---|---|
| 1 | 3.32° |
| 2 | 1.46° |
| 3 | 0.86° |

Roughly **halving per link**. That ratio, not the absolute tilt, is the cliff — and it is
the central known risk in the project. A stronger drive shifts the whole column up without
flattening it.

</details>

<details>
<summary>Stage 3: The learning problem (Complete)</summary>

Objective: an environment that is a genuine MDP, so PPO does what PPO is for.

Stated in full, because the parts usually left implicit are the ones that decide
whether PPO is the right tool: the **transition is deterministic** — a fixed number
of RK4 steps under a zero-order hold, with no noise injected anywhere — so the *only*
stochasticity in the whole problem is the initial state draw, currently a uniform
±0.05 rad about hanging with zero velocity at centre rail. The **discount is 0.995 at
the 100 Hz policy rate**, an effective horizon of 200 steps or 2 s, against an 8 s
episode. Deterministic dynamics plus a near-degenerate start means this sits closer to
a single trajectory optimisation than to a distribution of control problems, which is
the honest reason a trained policy here is fragile.

It is also Markov for a narrower reason than it looks. The observed cart position is
the actuator's *dead-reckoned belief*, while termination is judged on the truth. Those
agree only while no steps are lost — so the problem stays Markov **because losing steps
ends the episode immediately**, and the agent is never asked to act on a stale belief.
Switching that off, or switching the sensor model on, does not just make the task
harder; it turns it into a POMDP, and a memoryless network has no reason to be optimal
in one.

- **Observation**, `2 + 3N` numbers: normalised cart position and velocity, then
  per link `sin θ`, `cos θ`, and normalised rate. **sin/cos rather than the angle**
  because swing-up runs the angle through several revolutions, so the same pose
  recurs at θ and θ±2π. That collapses them to one input and removes every wrapping
  concern downstream — there is no angle-wrapping code anywhere in the RL path.
- **Action**: one number, the carriage acceleration, every control step. **No gain
  vector, no mode switching.** An earlier design had the network emit PID gains; it
  was abandoned because swing-up and balance are not the same gains and the handoff
  logic was doing the actual work.
- **Reward**: how upright the links are, minus small penalties on cart position and
  command effort, so upright scores +1 per step *at any link count*. Leaving the
  rail or losing steps ends the episode and costs 100.
- **The policy runs at 100 Hz over a 500 Hz plant.** Not a performance tweak: at
  500 Hz a discount of 0.99 looks 0.2 s ahead, which cannot represent a swing-up
  that takes seconds. It is also a zero-order hold, which is what the hardware does
  anyway.
- **Target angles are a parameter.** Every combination of links at 0 or π is an
  equilibrium, so an N-link chain has 2^N of them, and "first link up, second
  hanging" is a legitimate setpoint. The whole "which links up, which down" feature
  is a reward parameter and nothing structural.

</details>

<details>
<summary>Stage 4: PPO, written rather than imported (Complete at N=1)</summary>

Objective: a working PPO with no RL framework, because writing it is a goal of the
project rather than a cost.

Separate actor and critic trunks — a shared trunk saves parameters but couples the
policy and value gradients, and at this size the parameters are free and the
coupling is not. The rollout buffer is kept separate from the update on purpose: it
is all bookkeeping with an exactly checkable answer, and it is where the subtle
bugs live. Generalised advantage estimation on a custom three-step episode can
be verified with a calculator; a wrong advantage inside a training loop just looks
like "PPO does not learn."

Three things in here are easy to get wrong and expensive:

- **Normalise advantages per minibatch, not per batch.** Whitening the whole batch
  leaks information across minibatches and shifts the effective step size.
- **The loss maximises the surrogate, so it is negated.** A sign error trains a
  policy that is confidently and increasingly wrong, which reads as "PPO diverges"
  rather than as a typo. Verified with a directional test: on a task whose answer
  is known, the policy mean must move the right way, and does — symmetrically.
- **Small initialisation on the policy head.** Default initialisation makes the
  first actions large and the value estimates arbitrary, producing enormous early
  advantages and a first update that destroys the policy before it has seen
  anything.

### What actually happened

Solved at **iteration 120**, and it held near ceiling for **30 of 100 evaluations**,
from iteration 120 to 820. Three findings the design did not predict:

**There is no energy pumping.** Textbook swing-up drives the cart back and forth to
grow the amplitude over several passes, because the actuator is too weak to do it
in one. This one is not: the specified drive has about 3g available and a 0.25 m
link has a natural period near 0.8 s, so the cart whips the link over inside *half
a swing*. That is a property of the drive I specified, not of the policy — a weaker
motor would have to pump, and this result would not transfer.

**A finding I could not reproduce, kept because that is the finding.** An earlier
write-up of this project claimed that balancing and *quiet* balancing were learned
hundreds of iterations apart — a limit cycle reversing the command on 199 of 200
steps, eventually cleaned up by the effort penalty. Re-running it, that does not
happen: the command-reversal rate never exceeds 5% at any evaluation, and mean
effort in the hold is already 2e-6 at the first evaluation that solves the task.
Upright and quiet arrive together. The original run had not been kept and its
config no longer matched the repo, so there was nothing to check the claim
against — which is the actual lesson, and why the run is now regenerable from one
command.

**It collapsed three times, and only the third stuck.** At iteration 580 episodes
went from 800 steps to 10; it recovered. At 720 it happened again; it recovered
again. At 840 it happened a third time and never came back — the remaining 1,160
iterations produce nothing. The worst single update moved the policy more than
eight times further than its own trust region allowed, and 50 of 2,000 updates hit
the trust-region early stop. So collapse is not a freak event in this setup, it is
a standing mode that the policy twice happened to survive.

Two things worth carrying forward. **Evaluation gives no warning** — with the noise
off the policy scored 3,816 on a full-length episode while the sampled rollouts it
was actually training on were dying at 445 steps, and that gap sat there visibly
for hundreds of iterations before anything broke. And the checkpoint was originally
written unconditionally on every evaluation, so **the collapse would have
overwritten the policy that worked**. There is no undo for that; the trainer now
saves only on a new best, which is the only reason the best policy survived a run
that spent its last 58% dead.

</details>

<details>
<summary>Stage 5: One config file, and the bug that motivated it (Complete)</summary>

The first full training run died with episodes lasting **two control steps**. The
cart had not moved far enough to reach the rail, so the terminations had to be step
loss.

The training setup asked the motor for 30 m/s² but left the force envelope at a
header default of 10 N. Accelerating the cart at that rate needs about 25 N, so the
step-loss check fired on the first step of every episode, every time. The hardware
sizing had *already* concluded a stepper could not do this job and specified a
servo — the config simply never caught up.

The fix is structural rather than a corrected number. Every hardware and run value
now lives in **one JSON file**, behind a loader that:

- **requires every key** and names the missing one, because a default is a second
  source of truth and defaults are what caused this;
- **rejects physically inconsistent combinations**, including a force envelope that
  cannot produce the acceleration the same file asks for;
- checks the cross-field constraints that would otherwise surface as an assertion
  deep in a rollout, or as a training run that behaves nothing like the config
  appears to describe.

The MuJoCo model is *generated* from that same file for the same reason. A model carrying its own copy of the link masses would put the second
source of truth straight back.

</details>

<details>
<summary>Stage 6: Seeing it, and closing the loop (Complete)</summary>

Two distinct jobs, deliberately kept apart:

- **Replay.** Logged states are written into MuJoCo and rendered. Nothing is
  integrated, so what you watch is what actually happened, and a future
  disagreement between engines can never be mistaken for a rendering artifact.
- **Closed loop.** The exported policy weights drive MuJoCo directly: MuJoCo
  integrates, the network reads MuJoCo's own state each control step and chooses
  the command, and the loop closes.

The second is a genuine transfer test. The policy trained entirely against my own
plant and had never seen MuJoCo; it swings up and balances anyway, settling in
**0.31 s**. A second engine, the same answer.

**And it has a blind spot I only found by filming the failure.** I rendered the
*collapsed* policy — the one scoring −145 on 10-step episodes that never
recovers — expecting a clip of the cart slamming into the rail. It swings up and
balances cleanly for the full eight seconds.

Both results are correct. In training that policy dies of **step loss**, and the
logged trajectory says so unambiguously: cart velocity climbs −0.3 m/s every 10 ms,
which is the acceleration limit held saturated, and the episode ends on the step
that reaches **−3.0 m/s — the velocity ceiling**, where the modelled actuator's
available force has drooped to *zero*. Ten steps, 0.1 s, exactly the episode length.

The MuJoCo rollout reproduces the observation, the clamps and the decimation, but
carries no force envelope, because MuJoCo has no such concept and I never added
one. It still catches leaving the rail — a policy 140 iterations further into the
collapse does fail there, at 1.06 s — but it cannot see step loss at all.

That does not make the check worthless: it is still the only test independent of my
own derivation, and it caught four planted errors. It means it validates the
*equations*, not the *hardware envelope* — and the envelope is where sim-to-real
lives. I would not have found this if I had only filmed the policies that worked.

The network is exported as **plain-text weights** rather than TorchScript. The
actor is three linear layers and two activations, so reimplementing that forward
pass in NumPy is five lines — versus an afternoon making a module
loadable from Python for the same result. That decision also previews how the Pi
will run it.

</details>

<details>
<summary>Stage 7: More links (Not started)</summary>

The cliff from Stage 2 — measured at 5 m/s², so read it as a ratio rather than as a
tilt — has the basin roughly halving per link. Two
mitigations are identified but untested: a network emitting state-dependent gains,
and the observation that with a feedforward trajectory the feedback only has to
absorb tracking error rather than catch a fall — a much weaker requirement.

The cross-engine check should also be run at N=2 and N=3 before anything else. It
passes at N=1, where the inertia cross terms between links are **absent** — which
is exactly where a derivation error would hide.

</details>

<details>
<summary>Stage 8: Hardware (Not started)</summary>

Nothing is bought. The specification below is what the simulation demands, and the
control loop for the Pi is a stub that deliberately links only the dependency-free
half of the codebase.

Open question: **step pulse generation.** A Raspberry Pi has no programmable
real-time unit, so CPU-generated step edges will jitter under any Linux. A small
microcontroller over SPI, using its programmable I/O block for the step train, is
the escape hatch — not decided.

</details>

## By the numbers

Every figure here is measured, not targeted.

- **1 link solved**; the code generalises to **6**, and the LQR sweep has measured
  the basin at 2 and 3.
- **500 Hz** plant, **100 Hz** policy, 8-second episodes.
- **8.2 M policy steps** across 2,000 iterations, **CPU only**, no GPU anywhere in
  the project.
- **3,824.9 of a 4,000** reward ceiling; upright in **0.31 s**; held to **0.015°**;
  **0.34 m** of a ±1 m rail used.
- **10 test targets**, **9,435 individual checks**, run under `ctest`.
- Energy matches an independent implementation to **6.2e-16**; free drift **5.1e-9**
  at three links; RK4 order confirmed at **14×**.
- Cross-engine agreement converging at **15.4×** for a 16× finer step, with **4 of
  4** planted errors caught.
- **22.4 N** of belt force at 30 m/s², implying roughly 0.45 N·m at 1400 rpm and
  about 100 W mechanical — hence a **400 W servo**, and hence an open-loop stepper
  ruled out.

## What I am learning

**A default is a second source of truth.** The bug that cost a full training run
was not a wrong calculation; it was a value that was never stated, inherited
silently from a header while the file that appeared to configure the run said
nothing about it. The fix that mattered was not correcting the number but removing
the mechanism — a loader with no defaults at all, which fails loudly at startup
rather than producing a plausible-looking run that means nothing.

**Self-consistency is not correctness.** Three validation layers all passed while
being derived from the same set of equations I wrote. They would all have passed a
uniformly wrong plant. The only test that could catch that class of error was the
one against an engine that shares none of the derivation — and it only counts
because four deliberate errors were planted to prove it can fail.

**The diagnostics move before the score does.** The collapse was visible in the
exploration and trust-region numbers for hundreds of iterations before the return
curve noticed, and the evaluation score — the number that looks like the answer —
never warned at all. Watching the thing you care about is not the same as watching
the thing that predicts it.

**The smallest term in the reward decided the final behaviour.** A penalty a
hundred times smaller than the main objective was irrelevant for hundreds of
iterations and then determined everything, because it was the only term left with
anything to say once the main objective was saturated. Reward terms do not act in
proportion to their weights; they act in proportion to their weights *times the
gradient still available*.

**Writing the algorithm is the point, not the cost.** Every non-obvious bug in the
PPO — advantage normalisation scope, a sign on the objective, the distinction
between an episode ending and a clock running out — is invisible when you import
the algorithm, and each one produces a training run that fails quietly rather than
loudly.

## Keeping it honest

- **No hardware exists.** Every hardware figure is a requirement derived by running
  the design, not a measurement of anything physical.
- **One link.** N=2 and N=3 are supported by the code and characterised by the LQR
  sweep, but nothing has been trained on them, and the basin roughly halves per
  link. That sweep ran on an earlier 5 m/s² plant and has not been repeated against
  the 30 m/s² envelope the hardware section specifies.
- **The policy trains on ideal sensing.** Quantisation, noise, latency and filtered
  rate estimation are all implemented and all currently switched off. That switch is
  the largest single gap between these numbers and hardware, and no claim here
  survives flipping it until it has been re-measured.
- **The cross-engine check does not cover the actuator.** It validates the dynamics
  against an independent engine, but models no force droop and no step loss — so it
  will pass a policy that the hardware envelope rejects, and demonstrably does.
- **The controller is fragile.** With exploration noise off it is perfect; with the
  noise it trained under, episodes were ending at half the clock. That gap is a real
  transfer risk, not a training artifact — and it is what the three collapses came
  out of.
- **One seed, one run.** Every number here is from a single reproduction with a
  fixed seed. Nothing has been averaged over seeds, so the collapse iterations in
  particular should be read as "this happens" and not as "this happens at 840."
- **The swing-up strategy depends on having a strong motor.** At about 3g the cart
  can throw the link over in half a swing. A weaker drive would need genuine energy
  pumping, and the learned behaviour would not degrade into it gracefully — it would
  have to be relearned.

Sim results are reported as sim results. The point of the validation work is to say
exactly how far they go, and not one step further.
