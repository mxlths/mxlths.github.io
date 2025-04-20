// Generative Cycloid - P5.js Version

let gui;
let params = {
  // Speeds
  wheel1Speed: 0.02,
  wheel2Speed: 0.05,
  canvasWheelSpeed: 0.005,
  
  // Radii and attachment points
  wheel1Radius: 100,
  wheel2Radius: 80,
  wheel1AttachmentDist: 60,
  wheel2AttachmentDist: 50,
  
  // Wheel positions
  wheel1CenterX: -150,
  wheel1CenterY: 0,
  wheel2CenterX: 150,
  wheel2CenterY: 0,
  
  // Linkage parameters
  rod1Length: 250,
  rod2Length: 250,
  penRodRatio: 1.3,
  
  // Simulation control
  maxSteps: 2000,
  instantRender: false,
  use3DCanvasRotation: false,
  
  // Actions
  restartSimulation: function() { setupSimulation(); },
  exportSVG: function() { saveCycloid(); }
};

// Simulation state
let simulationTime = 0;
let currentStep = 0;

// Calculated points
let jointPosD = { x: 0, y: 0 };
let penPos = { x: 0, y: 0 };

// Path storage
let path = [];

// Mouse rotation variables
let mouseRotX = 0.3;
let mouseRotY = -0.4;
let prevMouseX = 0;
let prevMouseY = 0;
let mouseDragging = false;
let guiWidth = 240;

function setup() {
  createCanvas(1000, 800, WEBGL);
  
  // Initialize GUI
  gui = new dat.GUI();
  gui.width = 300;
  
  // Add controls grouped by category
  let f1 = gui.addFolder('Simulation Parameters');
  f1.add(params, 'maxSteps', 100, 5000).step(100).name('Simulation Steps');
  f1.add(params, 'instantRender').name('Instant Render');
  f1.add(params, 'use3DCanvasRotation').name('3D Canvas Rotation');
  f1.open();
  
  let f2 = gui.addFolder('Wheel Parameters');
  f2.add(params, 'wheel1Speed', 0, 0.1).step(0.001).name('Wheel 1 Speed');
  f2.add(params, 'wheel2Speed', 0, 0.1).step(0.001).name('Wheel 2 Speed');
  f2.add(params, 'canvasWheelSpeed', 0, 0.05).step(0.001).name('Canvas Rot Speed');
  f2.add(params, 'wheel1AttachmentDist', 0, 100).step(1).name('Wheel 1 Attach Dist');
  f2.add(params, 'wheel2AttachmentDist', 0, 100).step(1).name('Wheel 2 Attach Dist');
  f2.open();
  
  let f3 = gui.addFolder('Linkage Parameters');
  f3.add(params, 'rod1Length', 50, 400).step(1).name('Rod 1 Length');
  f3.add(params, 'rod2Length', 50, 400).step(1).name('Rod 2 Length');
  f3.add(params, 'penRodRatio', 0, 2).step(0.1).name('Pen Rod Ratio');
  f3.open();
  
  let f4 = gui.addFolder('Actions');
  f4.add(params, 'restartSimulation').name('Restart Simulation');
  f4.add(params, 'exportSVG').name('Export SVG');
  f4.open();
  
  // Initialize simulation
  setupSimulation();
}

function setupSimulation() {
  // Reset simulation state
  simulationTime = 0;
  currentStep = 0;
  path = [];
  
  // Check if we should render instantly
  if (params.instantRender) {
    console.log("Calculating full path instantly (" + (params.use3DCanvasRotation ? "3D" : "2D") + " mode)...");
    calculateFullPath();
    console.log("Calculation complete. Path points: " + path.length);
  } else {
    // Calculate initial position for step-by-step
    calculateJointAndPenPosition();
    if (penPos) {
      addCurrentPointToPath();
    } else {
      console.log("Error: Initial configuration is invalid.");
    }
  }
  
  console.log("Setup complete. Parameters set.");
}

// Calculate the intersection of two circles (for joint D)
function calculateCircleIntersection(p1, r1, p2, r2, preferPositiveCrossProduct) {
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;
  let dSq = dx * dx + dy * dy;
  let d = sqrt(dSq);
  
  // Check if the circles are too far apart, too close, or coincident
  if (d > r1 + r2 || d < abs(r1 - r2) || d === 0) {
    let tolerance = 1e-4;
    if (abs(d - (r1 + r2)) < tolerance || abs(d - abs(r1 - r2)) < tolerance) {
      if (abs(d - (r1 + r2)) < tolerance) {
        let vec = createVector(dx, dy).normalize().mult(r1);
        return { x: p1.x + vec.x, y: p1.y + vec.y };
      } else if (abs(d - abs(r1 - r2)) < tolerance) {
        let vec = createVector(dx, dy).normalize().mult(r1);
        return { x: p1.x + vec.x, y: p1.y + vec.y };
      }
    }
    return null;
  }
  
  // Calculate distance from p1 to the midpoint
  let a = (r1*r1 - r2*r2 + dSq) / (2*d);
  // Calculate height (perpendicular distance)
  let hSq = r1*r1 - a*a;
  let h = (hSq > 1e-6) ? sqrt(hSq) : 0;
  
  // Calculate the midpoint
  let mx = p1.x + (dx * a/d);
  let my = p1.y + (dy * a/d);
  
  // Calculate perpendicular vector
  let perpx = -dy;
  let perpy = dx;
  let perpMag = sqrt(perpx*perpx + perpy*perpy);
  if (perpMag < 1e-9) return null;
  
  // Normalize
  perpx /= perpMag;
  perpy /= perpMag;
  
  // Calculate intersection points
  let i1x = mx + (perpx * h);
  let i1y = my + (perpy * h);
  let i2x = mx - (perpx * h);
  let i2y = my - (perpy * h);
  
  // Determine which intersection to return
  let v1x = i1x - p1.x;
  let v1y = i1y - p1.y;
  let crossZ1 = dx * v1y - dy * v1x;
  
  if (preferPositiveCrossProduct) {
    return (crossZ1 >= 0) ? { x: i1x, y: i1y } : { x: i2x, y: i2y };
  } else {
    return (crossZ1 < 0) ? { x: i1x, y: i1y } : { x: i2x, y: i2y };
  }
}

function calculateJointAndPenPosition() {
  let angle1 = simulationTime * params.wheel1Speed;
  let angle2 = simulationTime * params.wheel2Speed;
  
  let wheel1Center = { x: params.wheel1CenterX, y: params.wheel1CenterY };
  let wheel2Center = { x: params.wheel2CenterX, y: params.wheel2CenterY };
  
  let attachmentA = {
    x: wheel1Center.x + params.wheel1AttachmentDist * cos(angle1),
    y: wheel1Center.y + params.wheel1AttachmentDist * sin(angle1)
  };
  
  let attachmentB = {
    x: wheel2Center.x + params.wheel2AttachmentDist * cos(angle2),
    y: wheel2Center.y + params.wheel2AttachmentDist * sin(angle2)
  };
  
  let preferPositiveCross = true;
  let calculatedD = calculateCircleIntersection(
    attachmentA, params.rod1Length,
    attachmentB, params.rod2Length,
    preferPositiveCross
  );
  
  if (calculatedD) {
    jointPosD = calculatedD;
    
    // Calculate vector from B to D
    let vecBD = {
      x: jointPosD.x - attachmentB.x,
      y: jointPosD.y - attachmentB.y
    };
    
    // Apply pen rod ratio
    penPos = {
      x: attachmentB.x + vecBD.x * params.penRodRatio,
      y: attachmentB.y + vecBD.y * params.penRodRatio
    };
    
    return true;
  } else {
    if (currentStep > 0 && !params.instantRender) {
      console.log("Error: Rods cannot connect at step " + currentStep + 
                  ". Dist=" + dist(attachmentA.x, attachmentA.y, attachmentB.x, attachmentB.y));
    }
    penPos = null;
    return false;
  }
}

function addCurrentPointToPath() {
  if (!penPos) return;
  
  let pointToAdd;
  let canvasAngle = simulationTime * params.canvasWheelSpeed;
  
  if (params.use3DCanvasRotation) {
    // Rotate the 2D pen position to create a 3D path
    let cosTheta = cos(canvasAngle);
    let sinTheta = sin(canvasAngle);
    let x_prime = penPos.x;
    let y_prime = penPos.y * cosTheta;
    let z_prime = penPos.y * sinTheta;
    pointToAdd = { x: x_prime, y: y_prime, z: z_prime };
  } else {
    // Regular 2D rotation in XY plane
    let rotX = penPos.x * cos(-canvasAngle) - penPos.y * sin(-canvasAngle);
    let rotY = penPos.x * sin(-canvasAngle) + penPos.y * cos(-canvasAngle);
    pointToAdd = { x: rotX, y: rotY, z: 0 };
  }
  
  // Add point if moved sufficiently or if it's the first point
  if (path.length === 0 || 
      dist(pointToAdd.x, pointToAdd.y, pointToAdd.z, 
           path[path.length-1].x, path[path.length-1].y, path[path.length-1].z) > 0.1) {
    path.push(pointToAdd);
  }
}

function calculateFullPath() {
  path = [];
  simulationTime = 0;
  currentStep = 0;
  
  while (currentStep < params.maxSteps) {
    if (calculateJointAndPenPosition()) {
      addCurrentPointToPath();
      simulationTime += 1.0;
      currentStep++;
    } else {
      console.log("Linkage error during instant calculation at step: " + currentStep);
      break;
    }
  }
}

function draw() {
  background(255);
  
  // Simulation logic (only if NOT instant render)
  if (!params.instantRender && currentStep < params.maxSteps) {
    // Check penPos validity from previous frame
    if (penPos === null && currentStep > 0) {
      // Linkage failed previously, stop further simulation
    } else {
      // Calculate next step
      calculateJointAndPenPosition();
      
      if (penPos) {
        addCurrentPointToPath();
        simulationTime += 1.0;
        currentStep++;
      } else {
        console.log("Simulation stopped at step " + currentStep + " due to linkage error.");
      }
    }
  }
  
  // Apply 3D transformations
  // Note: In WEBGL mode, origin is at center of canvas
  rotateX(mouseRotX);
  rotateY(mouseRotY);
  
  // Draw mechanism guides for 2D mode
  if (!params.instantRender && !params.use3DCanvasRotation) {
    push();
    
    let displayTime = simulationTime > 0 ? simulationTime - 1.0 : simulationTime;
    if (displayTime < 0) displayTime = 0;
    
    let currentAngle1 = displayTime * params.wheel1Speed;
    let currentAngle2 = displayTime * params.wheel2Speed;
    
    let currentA = {
      x: params.wheel1CenterX + params.wheel1AttachmentDist * cos(currentAngle1),
      y: params.wheel1CenterY + params.wheel1AttachmentDist * sin(currentAngle1)
    };
    
    let currentB = {
      x: params.wheel2CenterX + params.wheel2AttachmentDist * cos(currentAngle2),
      y: params.wheel2CenterY + params.wheel2AttachmentDist * sin(currentAngle2)
    };
    
    // Draw wheels
    noFill();
    stroke(180);
    strokeWeight(1);
    
    push();
    translate(params.wheel1CenterX, params.wheel1CenterY, 0);
    ellipse(0, 0, params.wheel1Radius * 2, params.wheel1Radius * 2);
    pop();
    
    push();
    translate(params.wheel2CenterX, params.wheel2CenterY, 0);
    ellipse(0, 0, params.wheel2Radius * 2, params.wheel2Radius * 2);
    pop();
    
    // Draw attachment points
    noStroke();
    
    // Point A
    push();
    translate(currentA.x, currentA.y, 0);
    fill(255, 0, 0, 150);
    sphere(5);
    pop();
    
    // Point B
    push();
    translate(currentB.x, currentB.y, 0);
    fill(0, 255, 0, 150);
    sphere(5);
    pop();
    
    if (jointPosD && penPos) {
      // Draw connecting rods
      stroke(150, 150);
      strokeWeight(2);
      line(currentA.x, currentA.y, 0, jointPosD.x, jointPosD.y, 0);
      line(currentB.x, currentB.y, 0, jointPosD.x, jointPosD.y, 0);
      
      if (params.penRodRatio > 1.0 || params.penRodRatio < 0.0) {
        stroke(100, 150);
        line(jointPosD.x, jointPosD.y, 0, penPos.x, penPos.y, 0);
      }
      
      // Draw joint and pen points
      push();
      translate(jointPosD.x, jointPosD.y, 0);
      fill(0, 255, 255, 150);
      noStroke();
      sphere(4);
      pop();
      
      push();
      translate(penPos.x, penPos.y, 0);
      fill(255, 0, 255, 150);
      sphere(3.5);
      pop();
    }
    
    pop();
  }
  
  // Draw the generated path
  stroke(0);
  strokeWeight(1);
  noFill();
  
  if (path.length > 1) {
    beginShape();
    
    // First control point
    curveVertex(path[0].x, path[0].y, path[0].z);
    
    // All points
    for (let p of path) {
      curveVertex(p.x, p.y, p.z);
    }
    
    // Last control point
    let last = path[path.length - 1];
    curveVertex(last.x, last.y, last.z);
    
    endShape();
  }
}

// Mouse interaction for rotation
function mousePressed() {
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  
  // Only consider dragging outside GUI area (left side)
  if (mouseX > guiWidth) {
    mouseDragging = true;
  } else {
    mouseDragging = false;
  }
}

function mouseDragged() {
  if (mouseDragging) {
    let dx = mouseX - prevMouseX;
    let dy = mouseY - prevMouseY;
    
    // Adjust rotation based on drag (adjust sensitivity as needed)
    mouseRotY += dx * 0.01;
    mouseRotX -= dy * 0.01;
    
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
}

function mouseReleased() {
  mouseDragging = false;
}

// SVG Export
function saveCycloid() {
  // Create a timestamped filename
  let now = new Date();
  let timestamp = now.getFullYear() + 
                 pad(now.getMonth() + 1) + 
                 pad(now.getDate()) + "_" + 
                 pad(now.getHours()) + 
                 pad(now.getMinutes()) + 
                 pad(now.getSeconds());
                 
  let filename = "GenerativeCycloid_" + timestamp + ".svg";
  console.log("Saving as: " + filename);
  
  // Use P5.js save function
  save(filename);
  console.log("SVG saved!");
}

// Utilities
function pad(num) {
  return num.toString().padStart(2, '0');
}

// Keyboard shortcuts
function keyPressed() {
  if (key === 'r' || key === 'R') {
    setupSimulation();
  } else if (key === 's' || key === 'S') {
    saveCycloid();
  }
} 