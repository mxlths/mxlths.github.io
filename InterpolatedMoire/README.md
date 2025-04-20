# Interpolated Moiré Sketch

This sketch generates complex moiré patterns using interpolated curves with random fluctuations. It creates striking visual designs by overlapping two or more layers with slight variations in rotation, scale, and point count.

## Core Features

* **Basic Pattern:** A curve that connects points arranged in a circle with random distance variations.
* **Moiré Effect:** Creates optical illusion patterns by overlapping multiple slightly modified layers.
* **Fluctuation System:** Applies controlled randomness to point positions for organic, varied designs.

## Adjustable Parameters

* **Basic Pattern:**
  * **Number of Points (n):** Controls the complexity of the base pattern (minimum 3).
  * **Offset:** Adds distance to the base radius for each point.
  * **Radius Scale:** Overall size multiplier for the pattern.

* **Duplication and Scale:**
  * **Cycle Count:** Number of duplicates in a shrink/grow cycle.
  * **Number of Cycles:** How many complete scale cycles to draw.
  * **Initial Scale Offset:** Starting scale factor for the first duplicate.
  * **Scale Decay:** Controls how quickly the pattern shrinks between duplicates.
  * **Fluctuation Amount:** Determines the randomness in point positions.

* **Draw Modes:**
  * **Curves:** Connects points with smooth curved lines.
  * **Radial Lines:** Draws lines from each point toward the center.
  * **Radial Line Length:** Controls the length of radial lines.
  * **Segments Per Curve:** When using radial lines mode, determines their density.
  * **Line Rotation:** Sets the rotation angle for each set of lines.

* **Moiré Effect Controls:**
  * **Enable Moiré Effect:** Toggles the layered moiré effect.
  * **Number of Layers:** Controls how many overlapping pattern layers to draw.
  * **Layer Rotation Offset:** Angular difference between layers (degrees).
  * **Layer Scale Offset:** Size difference between layers.
  * **Layer Point Offset:** Difference in point count between layers.

The sketch supports exporting the generated patterns as SVG files and includes a responsive UI panel for adjusting all parameters in real-time. 