# Polar Spirograph Sketch

Creates intricate spirograph-like patterns using a polar coordinate equation:

`r = scaleFactor * (effectiveBaseR + A1*sin(f1*theta + p1) + A2*sin(f2*theta + p2) + A3*sin(f3*theta + p3))`

Where `effectiveBaseR` is calculated based on the minimum gap radius and the absolute values of the amplitudes (A1, A2, A3) to ensure a central hole and consistent behavior.

Users can adjust the following parameters using the control panel:

*   **Main Parameters:** Control the overall size (`scaleFactor`) and the minimum radius of the central gap (`minGapRadius`).
*   **Term 1, 2, 3:** Independently set the amplitude (A), frequency (f), and phase (p) for each of the three sine components influencing the radius.
*   **Drawing Options:** Configure the total angular range (`thetaMaxCycles`), the number of points used for resolution (`numPoints`), and the line width.

The sketch allows regenerating the pattern based on current parameters and exporting the result as an SVG file. 