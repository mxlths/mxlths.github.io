// Lissajous3D - P5.js Version

let gui;

// Lissajous Curve 3D Parameters
let params = {
  // Amplitudes
  A: 200,            // Amplitude X
  B: 200,            // Amplitude Y
  C: 200,            // Amplitude Z
  
  // Frequencies
  a: 3,              // Frequency X
  b: 4,              // Frequency Y
  c: 5,              // Frequency Z
  
  // Phase shifts
  deltaDegrees: 90,  // Phase shift X (relative to sin) - standard Lissajous
  phi_zDegrees: 0,   // Phase shift Z (relative to sin)

  // Drawing Parameters
  scaleFactor: 1.0,
  numPoints: 1000,
  lineWidth: 1.0,
  tCycles: 1.0,      // How many full 2*PI cycles for t

  // Rotation Parameters (degrees)
  rotX: 0.0,
  rotY: 0.0,
  rotZ: 0.0,
  
  // Action
  exportSVG: function() { saveLissajous(); }
};

// Mouse Rotation Variables
let mouseRotX = 0.0;
let mouseRotY = 0.0;
let prevMouseX = 0;
let prevMouseY = 0;
let mousePressedOverCanvas = false;
let guiWidth = 220; // Approximate width of the GUI panel

function setup() {
  createCanvas(1200, 900, WEBGL); // Use WEBGL renderer (P5.js 3D)
  
  // Initialize GUI
  gui = new dat.GUI();
  gui.width = 300;
  
  // Add controls grouped by category
  let f1 = gui.addFolder('Amplitudes');
  f1.add(params, 'A', 10, 500).name('X Amplitude (A)').onChange(updateParams);
  f1.add(params, 'B', 10, 500).name('Y Amplitude (B)').onChange(updateParams);
  f1.add(params, 'C', 10, 500).name('Z Amplitude (C)').onChange(updateParams);
  f1.open();
  
  let f2 = gui.addFolder('Frequencies');
  f2.add(params, 'a', 0.1, 10).name('X Frequency (a)').onChange(updateParams);
  f2.add(params, 'b', 0.1, 10).name('Y Frequency (b)').onChange(updateParams);
  f2.add(params, 'c', 0.1, 10).name('Z Frequency (c)').onChange(updateParams);
  f2.open();
  
  let f3 = gui.addFolder('Phase Shifts');
  f3.add(params, 'deltaDegrees', 0, 360).name('X Phase (deg)').onChange(updateParams);
  f3.add(params, 'phi_zDegrees', 0, 360).name('Z Phase (deg)').onChange(updateParams);
  f3.open();
  
  let f4 = gui.addFolder('Drawing Parameters');
  f4.add(params, 'scaleFactor', 0.1, 5).name('Scale Factor').onChange(updateParams);
  f4.add(params, 'numPoints', 100, 5000).step(100).name('Points (Resolution)').onChange(updateParams);
  f4.add(params, 'lineWidth', 0.1, 5).step(0.1).name('Line Width').onChange(updateParams);
  f4.add(params, 'tCycles', 0.1, 10).name('T Cycles (x 2*PI)').onChange(updateParams);
  f4.open();
  
  let f5 = gui.addFolder('Rotation (deg)');
  f5.add(params, 'rotX', 0, 360).name('X Rotation').onChange(updateParams);
  f5.add(params, 'rotY', 0, 360).name('Y Rotation').onChange(updateParams);
  f5.add(params, 'rotZ', 0, 360).name('Z Rotation').onChange(updateParams);
  f5.open();
  
  let f6 = gui.addFolder('Actions');
  f6.add(params, 'exportSVG').name('Export SVG');
  f6.open();
}

function updateParams() {
  // This function is called whenever a GUI parameter changes
  // Empty for now as drawing happens continuously
}

function draw() {
  background(255); // White background
  
  // Apply transformations equivalent to Processing's
  // Note: P5.js uses a different coordinate system than Processing
  // In WEBGL mode, (0,0,0) is at center of canvas
  
  // Apply GUI rotations (convert degrees to radians)
  rotateZ(radians(params.rotZ));
  rotateY(radians(params.rotY));
  rotateX(radians(params.rotX));
  
  // Apply mouse rotation
  rotateY(mouseRotY);
  rotateX(mouseRotX);
  
  // Apply scaling
  scale(params.scaleFactor);
  
  // Draw the 3D Lissajous curve
  stroke(0); // Black lines
  strokeWeight(params.lineWidth);
  noFill();
  
  // Calculate common values
  let delta = radians(params.deltaDegrees); // Convert phase shift X to radians
  let phi_z = radians(params.phi_zDegrees); // Convert phase shift Z to radians
  let tMax = TWO_PI * params.tCycles;
  let steps = max(3, params.numPoints); // Ensure at least 3 points
  
  // Draw the curve
  beginShape();
  for (let i = 0; i <= steps; i++) {
    let t = map(i, 0, steps, 0, tMax);
    
    // Calculate 3D coordinates
    let x = params.A * sin(params.a * t + delta);
    let y = params.B * sin(params.b * t);
    let z = params.C * sin(params.c * t + phi_z);
    
    // Add the vertex in 3D space
    vertex(x, y, z);
  }
  endShape();
}

// Mouse interaction for rotation
function mousePressed() {
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  
  // We don't need to check for GUI area in P5.js as dat.gui handles its own interactions
  mousePressedOverCanvas = true;
}

function mouseDragged() {
  if (mousePressedOverCanvas) {
    let dx = mouseX - prevMouseX;
    let dy = mouseY - prevMouseY;
    
    // Adjust rotation speed as needed
    mouseRotY += dx * 0.01;
    mouseRotX -= dy * 0.01; // Note the minus sign (Y is flipped in screen coords)
    
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
}

function mouseReleased() {
  mousePressedOverCanvas = false;
}

// SVG Export
function saveLissajous() {
  // Create a timestamped filename
  let now = new Date();
  let timestamp = now.getFullYear() + 
                 pad(now.getMonth() + 1) + 
                 pad(now.getDate()) + "_" + 
                 pad(now.getHours()) + 
                 pad(now.getMinutes()) + 
                 pad(now.getSeconds());
                 
  let filename = "Lissajous3D_" + timestamp + ".svg";
  console.log("Saving as: " + filename);
  
  // Use P5.js save function
  save(filename);
  console.log("SVG saved!");
}

// Utilities
function pad(num) {
  return num.toString().padStart(2, '0');
}

function radians(degrees) {
  return degrees * Math.PI / 180;
}

// Keyboard shortcuts
function keyPressed() {
  if (key === 's' || key === 'S') {
    saveLissajous();
  }
} 