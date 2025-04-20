// Polar Spirograph - P5.js Version

// --- Spirograph Parameters ---
// Equation: r = scaleFactor * (effectiveBaseR + A1*sin(f1*theta + p1) + A2*sin(f2*theta + p2) + A3*sin(f3*theta + p3))
// where effectiveBaseR = minGapRadius + abs(A1) + abs(A2) + abs(A3)

let gui;
let params = {
  scaleFactor: 100.0,    // Overall size scaling
  minGapRadius: 0.1,     // Minimum radius before scaling, ensuring a hole
  
  // Sine Term 1
  A1: 1.0,               // Amplitude
  f1: 5.0,               // Frequency (relative to theta)
  p1Deg: 0.0,            // Phase (degrees)
  
  // Sine Term 2
  A2: 1.0,               // Amplitude
  f2: 12.0,              // Frequency
  p2Deg: 90.0,           // Phase (degrees)
  
  // Sine Term 3
  A3: 0.0,               // Amplitude (default 0 to not affect initial state)
  f3: 19.0,              // Frequency
  p3Deg: 45.0,           // Phase (degrees)
  
  // Drawing Parameters
  thetaMaxCycles: 10.0,  // How many full 2*PI cycles for theta
  numPoints: 2000,       // Resolution of the curve
  lineWidth: 1.0,        // Line width for drawing
  
  // Actions
  regenerate: function() { needsRegen = true; },
  exportSVG: function() { saveSpirograph(); }
};

// --- Data Structures ---
let pathPoints = [];      // Stores Cartesian points of the path
let needsRegen = true;    // Flag to regenerate the pattern

function setup() {
  createCanvas(1000, 1000);
  
  // Initialize GUI
  gui = new dat.GUI();
  gui.width = 300;
  
  // Add controls
  let f1 = gui.addFolder('Main Parameters');
  f1.add(params, 'scaleFactor', 1, 300).step(1).onChange(() => needsRegen = true);
  f1.add(params, 'minGapRadius', 0, 2).step(0.01).onChange(() => needsRegen = true);
  f1.open();
  
  let f2 = gui.addFolder('Term 1');
  f2.add(params, 'A1', -2, 2).step(0.01).onChange(() => needsRegen = true);
  f2.add(params, 'f1', 0, 20).step(0.1).onChange(() => needsRegen = true);
  f2.add(params, 'p1Deg', 0, 360).step(1).onChange(() => needsRegen = true);
  f2.open();
  
  let f3 = gui.addFolder('Term 2');
  f3.add(params, 'A2', -2, 2).step(0.01).onChange(() => needsRegen = true);
  f3.add(params, 'f2', 0, 20).step(0.1).onChange(() => needsRegen = true);
  f3.add(params, 'p2Deg', 0, 360).step(1).onChange(() => needsRegen = true);
  f3.open();
  
  let f4 = gui.addFolder('Term 3');
  f4.add(params, 'A3', -2, 2).step(0.01).onChange(() => needsRegen = true);
  f4.add(params, 'f3', 0, 20).step(0.1).onChange(() => needsRegen = true);
  f4.add(params, 'p3Deg', 0, 360).step(1).onChange(() => needsRegen = true);
  f4.open();
  
  let f5 = gui.addFolder('Drawing Options');
  f5.add(params, 'thetaMaxCycles', 1, 50).step(1).onChange(() => needsRegen = true);
  f5.add(params, 'numPoints', 100, 5000).step(100).onChange(() => needsRegen = true);
  f5.add(params, 'lineWidth', 0.1, 5).step(0.1).onChange(() => needsRegen = true);
  f5.open();
  
  let f6 = gui.addFolder('Actions');
  f6.add(params, 'regenerate').name('Regenerate Pattern');
  f6.add(params, 'exportSVG').name('Export SVG');
  f6.open();
}

// --- Path Generation ---
function regeneratePattern() {
  console.log("Generating Spirograph path...");
  pathPoints = [];
  
  let p1Rad = radians(params.p1Deg);
  let p2Rad = radians(params.p2Deg);
  let p3Rad = radians(params.p3Deg);
  let thetaMax = TWO_PI * params.thetaMaxCycles;
  
  // Calculate the effective base radius to ensure the minimum gap
  let effectiveBaseR = Math.max(0, params.minGapRadius) + 
                      Math.abs(params.A1) + 
                      Math.abs(params.A2) + 
                      Math.abs(params.A3);
  
  console.log("Effective Base R = " + effectiveBaseR + 
             " (MinGap=" + params.minGapRadius + 
             ", |A1|=" + Math.abs(params.A1) + 
             ", |A2|=" + Math.abs(params.A2) + 
             ", |A3|=" + Math.abs(params.A3) + ")");

  for (let i = 0; i <= params.numPoints; i++) {
    let theta = map(i, 0, params.numPoints, 0, thetaMax);
    
    // Calculate radius based on the formula using effectiveBaseR and all three terms
    let r = effectiveBaseR + 
            params.A1 * Math.sin(params.f1 * theta + p1Rad) + 
            params.A2 * Math.sin(params.f2 * theta + p2Rad) + 
            params.A3 * Math.sin(params.f3 * theta + p3Rad);
            
    r *= params.scaleFactor; // Apply overall scaling
    
    // Convert polar (r, theta) to Cartesian (x, y)
    let x = r * Math.cos(theta);
    let y = r * Math.sin(theta);
    
    pathPoints.push({x, y});
  }
  
  needsRegen = false;
  console.log("Path generated with " + pathPoints.length + " points.");
}

// --- Drawing ---
function draw() {
  if (needsRegen) {
    regeneratePattern();
  }

  background(255); // White background
  translate(width / 2, height / 2); // Center the drawing

  // Draw the generated path
  if (pathPoints.length > 1) {
    stroke(0);
    strokeWeight(params.lineWidth);
    noFill();
    
    beginShape();
    for (let p of pathPoints) {
      vertex(p.x, p.y);
    }
    endShape();
  }
}

// --- SVG Export ---
function saveSpirograph() {
  if (needsRegen) {
    console.log("Regenerating before export...");
    regeneratePattern();
  }
  
  // Create a timestamped filename
  let now = new Date();
  let timestamp = now.getFullYear() + 
                 pad(now.getMonth() + 1) + 
                 pad(now.getDate()) + "_" + 
                 pad(now.getHours()) + 
                 pad(now.getMinutes()) + 
                 pad(now.getSeconds());
  
  let filename = "Spirograph_" + timestamp + ".svg";
  console.log("Saving as: " + filename);
  
  // Use P5.js saveCanvas function
  saveCanvas(filename, 'svg');
  console.log("SVG saved!");
}

// --- Utilities ---
function pad(num) {
  return num.toString().padStart(2, '0');
}

function radians(degrees) {
  return degrees * Math.PI / 180;
}

// Keyboard shortcuts
function keyPressed() {
  if (key === 's' || key === 'S') {
    saveSpirograph();
  } else if (key === 'r' || key === 'R') {
    needsRegen = true;
  }
} 