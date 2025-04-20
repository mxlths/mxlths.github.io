# Lissajous Spiral Sketch

This sketch generates complex patterns based on Lissajous curves, extended with several additional features for creating diverse visual outputs in both 2D and 3D.

Core functionality is based on the Lissajous equations:
*   `x = A * sin(a * t + delta)`
*   `y = B * sin(b * t)`
*   `z = Az * sin(fz * t + pz)` (if 3D enabled)

Key features and adjustable parameters include:

*   **Lissajous Parameters:** Control amplitudes (A, B), frequencies (a, b), and phase shift (delta) for the base curve.
*   **Z Modulation:** Enable 3D view and control Z-axis amplitude (Az), frequency (fz), and phase (pz).
*   **Drawing Options:** Set the number of points (resolution), line width, and duration (`tCycles`).
*   **Repetition:** 
    *   Draw multiple copies (`numDuplicates`) of the curve.
    *   Apply incremental rotation (`rotationStepDegrees`) between copies.
    *   Enable `useSpiralRepetition` to arrange duplicates in a spiral pattern, controlling total angle and radial spread.
*   **Draw Modes:** 
    *   Draw the curve itself (Mode 0).
    *   Draw lines perpendicular to the curve (Mode 1), controlling density and length.
*   **Offset Cycles:** Create layered effects by drawing the curve multiple times (`numberOfOffsetCycles`), each time scaling it down based on `initialScaleOffset` and `scaleDecay` over `offsetCycleCount` steps.
*   **Wave Modulation:** Apply a sinusoidal displacement perpendicular to the curve path, controlled by `waveDepth` and `waveFreq`.
*   **3D View Controls:** If 3D is enabled, use preset view buttons (Front, Top, etc.) or mouse drag to rotate the view.

 The sketch offers both single-view SVG export and a multi-view SVG export that generates a grid of standard orthographic and isometric views. 