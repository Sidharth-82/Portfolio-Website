---
label: VLA Eval Layer
sublabel: In progress
order: 1
---

**A test harness for vision-language-action robot policies.** I reproduced
OpenVLA-7B's published LIBERO baseline (**83.6% vs 84.7%**), then ran a
**2,000-episode** sweep that paraphrases the instruction. Success drops to
**71.0%** (p = 3.1e-7), and almost all of that drop arrives as soon as the
sentence structure changes.

**Next:** automatically classifying every failed episode from the step-level data
already collected.

[See the project →](/projects/#vla-eval)
