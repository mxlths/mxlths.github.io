# Lissajous 3D Sketch

Generates and visualizes Lissajous curves in three dimensions using the p5.js WEBGL renderer.

The shape of the curve is determined by the parametric equations:

*   `x = A * sin(a * t + delta)`
*   `y = B * sin(b * t)`
*   `z = C * sin(c * t + phi_z)`

Users can modify the following parameters via the control panel:

*   **Amplitudes (A, B, C):** Control the extent of the curve along each axis.
*   **Frequencies (a, b, c):** Determine the number of oscillations along each axis.
*   **Phase Shifts (delta, phi_z):** Adjust the starting phase for the X and Z components.
*   **Drawing Parameters:** Control the overall scale, the number of points (resolution), line width, and the number of cycles for the parameter `t`.
*   **Rotation:** Set static rotation angles around the X, Y, and Z axes.

The view can be interactively rotated by clicking and dragging the mouse on the canvas. The sketch also supports exporting the current view as an SVG file. 