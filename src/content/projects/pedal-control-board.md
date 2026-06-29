---
title: Solar Car Pedal Control Board
summary: A pedal-interface PCB for the Midnight Sun Solar Car Team, conditioning and digitizing pedal sensor signals.
image: /images/projects/pedal-control-board.svg
github: https://github.com/Sidharth-82
tags: [Altium, PCB, Analog, Op-Amp, ADC, I2C]
featured: false
order: 12
---

<!--
IMAGE NEEDED: Replace /images/projects/pedal-control-board.svg with the PCB
render or the signal-conditioning block diagram from the portfolio PDF
("Midnight Sun Solar Car Team – Pedal Control Board").
GITHUB: this is a student-team board — replace/remove the repo link if there's
no public repository.
-->

**Solar Car Pedal Control Board** is a pedal-interface board I designed for the
**Midnight Sun Solar Car Team** to receive and condition signals from the foot
pedals, designed in **Altium**.

## Highlights

- Tested and analyzed accelerator-pedal output signals, including computing the
  required **gain**.
- Designed a **non-inverting op-amp feedback loop** to amplify the discernible
  difference in pedal output values.
- Engineered a **Schmitt-trigger** circuit to reject electrical noise and debounce
  the limit-switch input.
- Digitized the conditioned analog signals with a **MAXIM 11601 8-bit ADC** and
  sent the data to the main controller over **I2C**.

## What I learned

Hands-on analog and mixed-signal design: matching amplifier gain to a sensor's
real output range, and using a Schmitt trigger to make a noisy mechanical switch
behave like a clean digital input.
