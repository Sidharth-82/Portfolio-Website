---
title: FreeRTOS Bluetooth RC Car
summary: An Arduino RC car using FreeRTOS for multitasking, controlled over Bluetooth from a custom Flutter app.
image: /images/projects/freertos-rc-car.svg
github: https://github.com/Sidharth-82
tags: [C++, FreeRTOS, Arduino, Bluetooth, Flutter, I2C, UART]
featured: false
order: 11
---

<!--
IMAGE NEEDED: Replace /images/projects/freertos-rc-car.svg with a photo of the
assembled RC car or a FreeRTOS task diagram. No image exists in the portfolio
PDF for this project.
GITHUB: confirm/replace the repo link if a dedicated repo exists.
-->

**FreeRTOS Bluetooth RC Car** is an Arduino-based RC car that uses the
**FreeRTOS** SDK for task management, controlled over Bluetooth from a custom
mobile app.

## Highlights

- Built **six FreeRTOS tasks**: Bluetooth command handling, motor-speed control,
  sensor monitoring, app-UI updates, a safety monitor, and a debug task.
- Designed a custom **Flutter** (Dart) Android app to act as the Bluetooth remote.
- Used the **HC-05** module over **UART** for Bluetooth communication with the
  Arduino.
- Integrated an **L298P** motor controller for bidirectional motor control and an
  **MPU-6050** accelerometer/gyroscope over **I2C**.

## What I learned

Decomposing the system into independent RTOS tasks — with a dedicated safety
monitor — taught me how real-time scheduling, queues, and mutexes keep
concurrent embedded behavior predictable.
