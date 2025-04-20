// Lissajous Curve Parameters
let A = 200; // Amplitude X
let B = 200; // Amplitude Y
let a = 3;   // Frequency X
let b = 4;   // Frequency Y
let deltaDegrees = 90; // Phase shift in degrees

// Z Modulation Parameters
let Az = 0; // Amplitude Z (default 0 for 2D compatibility) 
let fz = 1.0; // Frequency Z
let pzDeg = 0.0; // Phase Z (degrees)

// 3D View Parameters
let enable3DView = false;
let rotX = 0;
let rotY = 0;
let zoom = 1.0;
let transX = 0;
let transY = 0;
let lastMouseX = 0;
let lastMouseY = 0;

// Drawing Parameters
let numPoints = 1000;
let lineWidth = 1.0;
let tCycles = 1.0; // How many full 2*PI cycles for t

// Repetition Parameters
let numDuplicates = 1;          // Number of curves to draw
let rotationStepDegrees = 5.0;  // Degrees to rotate between each duplicate
let baseRotationDegrees = 0.0;  // Initial rotation for the first curve
let useSpiralRepetition = false;
let spiralTotalDegrees = 360.0;
let spiralAmplitude = 1.0; // Factor controlling radial spread

// Perpendicular Line Mode Parameters
let drawMode = 0; // 0 = Curve, 1 = Perpendicular Lines
let lineDensity = 500; // Number of perpendicular lines to draw
let perpLineLength = 10.0; // Length of each perpendicular line (pixels)

// Offset Cycle Parameters
let offsetCycleCount = 20;      // Steps per shrink/grow cycle
let numberOfOffsetCycles = 1;   // Number of times to repeat the cycle
let initialScaleOffset = 1.1;   // Initial relative size factor (e.g., 1.1 = 10% larger)
let scaleDecay = 0.95;          // Decay factor for scaling per step

// Wave Modulation Parameters
let waveDepth = 0.0; // Amplitude of the wave offset (pixels)
let waveFreq = 5.0;  // Frequency of the wave along the curve (cycles per 2*PI of t)

// Base Scale Factor (NEW)
let scaleFactor = 1.0;

// SVG Export
let svgOutput = null;

// Multi-view SVG Export State Variables - no longer needed with new approach
let doingMultiViewExport = false;
let multiViewSvg = null;
let currentViewIndex = 0;
let viewWidth, viewHeight;
let savedViewState = [0, 0, 0, 0]; // rotX, rotY, transX, transY
let viewConfigs = [
  // rotX, rotY, position (gridX, gridY)
  [0, 0, 1, 1],                 // Current view (center)
  [0, 0, 1, 0],                 // Front (top-center)
  [0, Math.PI, 1, 2],                // Back (bottom-center)
  [0, -Math.PI/2, 0, 1],          // Left (center-left)
  [0, Math.PI/2, 2, 1],           // Right (center-right)
  [-Math.PI/2, 0, 0, 0],          // Top (top-left)
  [Math.PI/2, 0, 2, 0],           // Bottom (top-right)
  [Math.PI/2, Math.PI, 0, 2],          // Bottom-Back (bottom-left) 
  [-Math.PI/2, Math.PI, 2, 2]          // Top-Back (bottom-right)
];
let viewLabels = [
  "Current View", "Front", "Back", "Left", "Right", "Top", "Bottom", "Bottom-Back", "Top-Back"
];

// Define SVG constant explicitly 
const SVG = 'svg';

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  console.log("Setup complete");
  
  // Set up event listeners for all sliders
  setupEventListeners();
}

function setupEventListeners() {
  // Lissajous Parameters
  setupParameterControls("A", 0);
  setupParameterControls("B", 0);
  setupParameterControls("a", 2);
  setupParameterControls("b", 2);
  setupParameterControls("delta", 0);
  
  // Z Modulation Parameters
  setupParameterControls("Az", 0);
  setupParameterControls("fz", 2);
  setupParameterControls("pzDeg", 0);
  
  document.getElementById("enable3D-toggle").addEventListener("change", function() {
    enable3DView = this.checked;
    
    // Show/hide 3D controls when 3D view is toggled
    document.querySelectorAll(".view-controls").forEach(el => {
      el.style.display = enable3DView ? "block" : "none";
    });
  });
  
  // Drawing Parameters
  setupParameterControls("numPoints", 0);
  setupParameterControls("lineWidth", 1);
  setupParameterControls("tCycles", 1);
  
  // Draw Mode
  document.getElementById("drawMode-select").addEventListener("change", function() {
    drawMode = parseInt(this.value);
  });
  
  setupParameterControls("lineDensity", 0);
  setupParameterControls("perpLineLength", 1);
  
  // Repetition Parameters
  setupParameterControls("numDuplicates", 0);
  setupParameterControls("rotationStep", 1);
  setupParameterControls("baseRotation", 0);
  
  document.getElementById("spiral-toggle").addEventListener("change", function() {
    useSpiralRepetition = this.checked;
  });
  
  setupParameterControls("spiralTotalDegrees", 0);
  setupParameterControls("spiralAmplitude", 1);
  
  // Offset Cycle Parameters
  setupParameterControls("offsetCycleCount", 0);
  setupParameterControls("numberOfOffsetCycles", 0);
  setupParameterControls("initialScaleOffset", 2);
  setupParameterControls("scaleDecay", 2);
  
  // Wave Parameters
  setupParameterControls("waveDepth", 0);
  setupParameterControls("waveFreq", 1);
  
  // View buttons
  document.getElementById("view-front").addEventListener("click", () => setView("front"));
  document.getElementById("view-back").addEventListener("click", () => setView("back"));
  document.getElementById("view-left").addEventListener("click", () => setView("left"));
  document.getElementById("view-right").addEventListener("click", () => setView("right"));
  document.getElementById("view-top").addEventListener("click", () => setView("top"));
  document.getElementById("view-bottom").addEventListener("click", () => setView("bottom"));
  document.getElementById("view-reset").addEventListener("click", () => setView("reset"));
  
  // Buttons
  document.getElementById("export-svg").addEventListener("click", exportSVG);
  document.getElementById("export-multiview").addEventListener("click", exportMultiViewSVG);
  document.getElementById("reset-params").addEventListener("click", resetParameters);
}

// Helper function to set up parameter controls (slider, display and text input)
function setupParameterControls(paramName, decimalPlaces) {
  const sliderId = `${paramName}-value`;
  const displayId = `${paramName}-display`;
  const inputId = `${paramName}-input`;
  
  // Get variable reference based on parameter name
  const getVarRef = () => {
    switch(paramName) {
      case "A": return A;
      case "B": return B;
      case "a": return a;
      case "b": return b;
      case "delta": return deltaDegrees;
      case "numPoints": return numPoints;
      case "lineWidth": return lineWidth;
      case "tCycles": return tCycles;
      case "numDuplicates": return numDuplicates;
      case "rotationStep": return rotationStepDegrees;
      case "baseRotation": return baseRotationDegrees;
      case "waveDepth": return waveDepth;
      case "waveFreq": return waveFreq;
      case "Az": return Az;
      case "fz": return fz;
      case "pzDeg": return pzDeg;
      case "lineDensity": return lineDensity;
      case "perpLineLength": return perpLineLength;
      case "offsetCycleCount": return offsetCycleCount;
      case "numberOfOffsetCycles": return numberOfOffsetCycles;
      case "initialScaleOffset": return initialScaleOffset;
      case "scaleDecay": return scaleDecay;
      case "spiralTotalDegrees": return spiralTotalDegrees;
      case "spiralAmplitude": return spiralAmplitude;
      default: return null;
    }
  };
  
  // Set variable based on parameter name
  const setVarValue = (value) => {
    switch(paramName) {
      case "A": A = value; break;
      case "B": B = value; break;
      case "a": a = value; break;
      case "b": b = value; break;
      case "delta": deltaDegrees = value; break;
      case "numPoints": numPoints = value; break;
      case "lineWidth": lineWidth = value; break;
      case "tCycles": tCycles = value; break;
      case "numDuplicates": numDuplicates = value; break;
      case "rotationStep": rotationStepDegrees = value; break;
      case "baseRotation": baseRotationDegrees = value; break;
      case "waveDepth": waveDepth = value; break;
      case "waveFreq": waveFreq = value; break;
      case "Az": Az = value; break;
      case "fz": fz = value; break;
      case "pzDeg": pzDeg = value; break;
      case "lineDensity": lineDensity = value; break;
      case "perpLineLength": perpLineLength = value; break;
      case "offsetCycleCount": offsetCycleCount = value; break;
      case "numberOfOffsetCycles": numberOfOffsetCycles = value; break;
      case "initialScaleOffset": initialScaleOffset = value; break;
      case "scaleDecay": scaleDecay = value; break;
      case "spiralTotalDegrees": spiralTotalDegrees = value; break;
      case "spiralAmplitude": spiralAmplitude = value; break;
    }
  };
  
  // Format value for display
  const formatValue = (value) => {
    return decimalPlaces > 0 ? value.toFixed(decimalPlaces) : value.toString();
  };
  
  // Handle slider input
  document.getElementById(sliderId).addEventListener("input", function() {
    const newValue = parseFloat(this.value);
    setVarValue(newValue);
    document.getElementById(displayId).textContent = formatValue(newValue);
    document.getElementById(inputId).value = newValue;
  });
  
  // Handle direct numeric input
  document.getElementById(inputId).addEventListener("input", function() {
    // Check if the input is valid
    const newValue = parseFloat(this.value);
    if (!isNaN(newValue)) {
      setVarValue(newValue);
      document.getElementById(displayId).textContent = formatValue(newValue);
      document.getElementById(sliderId).value = newValue;
    }
  });
}

function resetParameters() {
  // Reset all parameters to default values
  A = 200;
  B = 200;
  a = 3;
  b = 4;
  deltaDegrees = 90;
  numPoints = 1000;
  lineWidth = 1.0;
  tCycles = 1.0;
  numDuplicates = 1;
  rotationStepDegrees = 5.0;
  baseRotationDegrees = 0.0;
  useSpiralRepetition = false;
  waveDepth = 0.0;
  waveFreq = 5.0;
  Az = 0;
  fz = 1.0;
  pzDeg = 0.0;
  lineDensity = 500;
  perpLineLength = 10.0;
  offsetCycleCount = 20;
  numberOfOffsetCycles = 1;
  initialScaleOffset = 1.1;
  scaleDecay = 0.95;
  spiralTotalDegrees = 360.0;
  spiralAmplitude = 1.0;
  
  // Update all UI elements
  updateUIFromValues();
}

function updateUIFromValues() {
  // Update all sliders, displays and input fields to match current values
  updateControl("A", A, 0);
  updateControl("B", B, 0);
  updateControl("a", a, 2);
  updateControl("b", b, 2);
  updateControl("delta", deltaDegrees, 0);
  updateControl("numPoints", numPoints, 0);
  updateControl("lineWidth", lineWidth, 1);
  updateControl("tCycles", tCycles, 1);
  updateControl("numDuplicates", numDuplicates, 0);
  updateControl("rotationStep", rotationStepDegrees, 1);
  updateControl("baseRotation", baseRotationDegrees, 0);
  updateControl("waveDepth", waveDepth, 0);
  updateControl("waveFreq", waveFreq, 1);
  updateControl("Az", Az, 0);
  updateControl("fz", fz, 2);
  updateControl("pzDeg", pzDeg, 0);
  updateControl("lineDensity", lineDensity, 0);
  updateControl("perpLineLength", perpLineLength, 1);
  updateControl("offsetCycleCount", offsetCycleCount, 0);
  updateControl("numberOfOffsetCycles", numberOfOffsetCycles, 0);
  updateControl("initialScaleOffset", initialScaleOffset, 2);
  updateControl("scaleDecay", scaleDecay, 2);
  updateControl("spiralTotalDegrees", spiralTotalDegrees, 0);
  updateControl("spiralAmplitude", spiralAmplitude, 1);
  
  document.getElementById("spiral-toggle").checked = useSpiralRepetition;
}

// Helper function to update control elements
function updateControl(paramName, value, decimalPlaces) {
  const sliderId = `${paramName}-value`;
  const displayId = `${paramName}-display`;
  const inputId = `${paramName}-input`;
  
  document.getElementById(sliderId).value = value;
  document.getElementById(displayId).textContent = decimalPlaces > 0 ? value.toFixed(decimalPlaces) : value;
  document.getElementById(inputId).value = value;
}

function draw() {
  background(255);
  
  // Remove the multi-view export handling as it's no longer needed
  // if (doingMultiViewExport) {
  //   handleMultiViewExport();
  //   return; // Skip regular drawing during export
  // }
  
  // Set up 3D view if enabled
  if (enable3DView) {
    // Apply 3D camera transformations
    translate(transX, transY, 0);
    rotateX(rotX);
    rotateY(rotY);
    scale(zoom);
  }
  
  stroke(0);
  strokeWeight(lineWidth);
  noFill();
  
  // Draw pattern with all parameters
  drawPattern();
}

function drawPattern() {
  // Base scale 
  let currentTotalScale = scaleFactor;
  
  // Only apply offset cycles if numberOfOffsetCycles > 0
  if (numberOfOffsetCycles > 0) {
    // --- Use Offset Cycle Logic --- 
    let effectiveCycleCount = max(2, offsetCycleCount);
    let effectiveNumCycles = numberOfOffsetCycles; // Already checked to be >= 0
    let halfCycle = effectiveCycleCount / 2;
    // Ensure the relative offset is positive for calculation
    let firstRelativeOffset = max(1e-6, initialScaleOffset - 1.0); 
    
    // Base scale for the innermost curve (can be modified by UI)
    currentTotalScale = scaleFactor; 
  
    // Outer loop for cycles
    for (let cycleNum = 0; cycleNum < effectiveNumCycles; cycleNum++) {
      // Inner loop for steps within a cycle
      for (let d = 0; d < effectiveCycleCount; d++) { 
        // Calculate exponent for decay based on shrink/grow phase
        let exponentIndex = (d < halfCycle) ? d : (effectiveCycleCount - 1 - d);
        // Calculate the scale factor for this specific step relative to the previous
        let stepScaleFactor = 1.0 + firstRelativeOffset * pow(scaleDecay, exponentIndex); 
        // Apply the step scale factor cumulatively
        currentTotalScale *= stepScaleFactor; 

        if (currentTotalScale <= 1e-6) { // Skip if scale becomes too small
          continue; 
        }

        // Calculate the overall duplicate index for rotation
        let totalDuplicateIndex = cycleNum * effectiveCycleCount + d;
        
        // Apply either spiral or rotation pattern
        if (useSpiralRepetition) {
          // Use spiral placement
          let spiralAngle = map(totalDuplicateIndex, 0, numDuplicates, 0, radians(spiralTotalDegrees));
          let spiralRadius = map(totalDuplicateIndex, 0, numDuplicates, 0, spiralAmplitude * max(A, B));
          
          push();
          translate(spiralRadius * cos(spiralAngle), spiralRadius * sin(spiralAngle));
          // Still apply base rotation 
          rotate(radians(baseRotationDegrees));
          drawSingleCurve(currentTotalScale);
          pop();
        } else {
          // Use original rotation pattern
          let currentRotationDegrees = baseRotationDegrees + (totalDuplicateIndex * rotationStepDegrees);
          push();
          rotate(radians(currentRotationDegrees));
          drawSingleCurve(currentTotalScale);
          pop();
        }
      }
      // Reset the scale for the next cycle to start from the base scale again
      currentTotalScale = scaleFactor; 
    }
  }
  
  // --- Draw regular duplicates without offset scaling ---
  // This ensures we still draw the duplicates even if offset cycles are disabled
  if (numDuplicates > 1) {
    for (let i = 0; i < numDuplicates; i++) {
      push();
      
      if (useSpiralRepetition) {
        // Use spiral placement
        let spiralAngle = map(i, 0, numDuplicates, 0, radians(spiralTotalDegrees));
        let spiralRadius = map(i, 0, numDuplicates, 0, spiralAmplitude * max(A, B));
        translate(spiralRadius * cos(spiralAngle), spiralRadius * sin(spiralAngle));
        rotate(radians(baseRotationDegrees));
      } else {
        // Use standard rotation
        let currentRotationDegrees = baseRotationDegrees + (i * rotationStepDegrees);
        rotate(radians(currentRotationDegrees));
      }
      
      drawSingleCurve(scaleFactor);
      pop();
    }
  } else {
    // Just draw one curve with base rotation
    push();
    rotate(radians(baseRotationDegrees));
    drawSingleCurve(scaleFactor);
    pop();
  }
}

function drawSingleCurve(totalScale) {
  push(); // Isolate transformations
  scale(totalScale); // Apply the calculated total scale for THIS curve
  
  let delta = radians(deltaDegrees);
  let pzRad = radians(pzDeg);
  let tMax = TWO_PI * tCycles;
  
  // --- Branch based on Draw Mode ---
  if (drawMode == 0) { // Draw Mode 0: Curve
    beginShape();
    for (let i = 0; i <= numPoints; i++) {
      let t = map(i, 0, numPoints, 0, tMax);
      
      // Base Lissajous point
      let x = A * sin(a * t + delta);
      let y = B * sin(b * t);
      
      // Z modulation for 3D
      let z = Az * sin(fz * t + pzRad);
      
      // Apply wave modulation if depth is significant
      if (abs(waveDepth) > 0.1) {
        // Calculate tangent vector (derivative dx/dt, dy/dt)
        let tx = A * a * cos(a * t + delta);
        let ty = B * b * cos(b * t);
        
        // Calculate normal vector (rotate tangent 90 degrees)
        let nx = -ty;
        let ny = tx;
        
        // Normalize the normal vector
        let mag = sqrt(nx*nx + ny*ny);
        if (mag > 0.0001) { // Avoid division by zero if tangent is zero
          nx /= mag;
          ny /= mag;
          
          // Calculate wave offset for this point 't'
          let waveOffset = waveDepth * sin(waveFreq * t);
          
          // Displace the point along the normal
          x += nx * waveOffset;
          y += ny * waveOffset;
        }
      }
      
      // Use 3D or 2D vertex based on Z value
      if (enable3DView && Az > 0) {
        vertex(x, y, z);
      } else {
        vertex(x, y);
      }
    }
    endShape();
  } else { // Draw Mode 1: Perpendicular Lines
    let numLines = max(1, lineDensity); // Ensure at least 1 line
    let halfLineLen = perpLineLength / 2.0;
    
    for (let i = 0; i < numLines; i++) {
      // Calculate t for this line segment
      let t = map(i, 0, numLines, 0, tMax); // Map across the density
      
      // Calculate base point on the curve (center of the line)
      let cx = A * sin(a * t + delta);
      let cy = B * sin(b * t);
      let cz = Az * sin(fz * t + pzRad); // Z coordinate
      
      // Calculate tangent vector (derivative dx/dt, dy/dt)
      let tx = A * a * cos(a * t + delta);
      let ty = B * b * cos(b * t);
          
      // Calculate normal vector (rotate tangent 90 degrees)
      let nx = -ty;
      let ny = tx;
      
      // Normalize the normal vector
      let mag = sqrt(nx*nx + ny*ny);
      if (mag > 0.0001) { // Avoid division by zero if tangent is zero
        nx /= mag;
        ny /= mag;
        
        // Calculate endpoints of the perpendicular line
        let x1 = cx + nx * halfLineLen;
        let y1 = cy + ny * halfLineLen;
        let x2 = cx - nx * halfLineLen;
        let y2 = cy - ny * halfLineLen;
        
        // Draw the line segment in 2D or 3D
        if (enable3DView && Az > 0) {
          line(x1, y1, cz, x2, y2, cz); // Z is same for both endpoints
        } else {
          line(x1, y1, x2, y2);
        }
      } 
      // Else: if mag is near zero, tangent is undefined/zero, skip drawing line for this point
    }
  }
  
  pop(); // Restore previous transformation state
}

// Function to export as SVG
function exportSVG() {
  console.log("Attempting minimal SVG export...");
  
  try {
    // Minimal hardcoded SVG content
    const minimalSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <rect width="100%" height="100%" fill="white"/>
      <text x="10" y="50" font-family="Arial" font-size="12">Basic SVG Export</text>
      <text x="10" y="70" font-family="Arial" font-size="10">(Drawing export unavailable)</text>
    </svg>`;
    
    // Create a link element to trigger download
    let link = document.createElement('a');
    link.download = `LissajousSpiral_Fallback_${getTimestamp()}.svg`;
    
    // Create Blob and Object URL
    let blob = new Blob([minimalSvgString], {type: 'image/svg+xml'});
    link.href = URL.createObjectURL(blob);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up Object URL
    
    console.log("Minimal SVG fallback exported");
    alert("SVG export feature is currently unavailable. A basic fallback SVG has been downloaded.");

  } catch (error) {
    console.error("Minimal SVG export failed:", error);
    alert("SVG export failed completely. Please try taking a screenshot instead.");
  }
}

// Function to export multi-view SVG
function exportMultiViewSVG() {
  console.log("Attempting minimal multi-view SVG export...");
  
  try {
    // Minimal hardcoded multi-view SVG content
    const minimalSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <rect width="100%" height="100%" fill="white"/>
      <text x="10" y="50" font-family="Arial" font-size="12">Basic Multi-View SVG Export</text>
      <text x="10" y="70" font-family="Arial" font-size="10">(Drawing export unavailable)</text>
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="100" y="0" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="200" y="0" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="0" y="100" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="100" y="100" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="200" y="100" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="0" y="200" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="100" y="200" width="100" height="100" fill="none" stroke="#ccc"/>
      <rect x="200" y="200" width="100" height="100" fill="none" stroke="#ccc"/>
    </svg>`;
    
    // Create a link element to trigger download
    let link = document.createElement('a');
    link.download = `LissajousSpiral_MultiView_Fallback_${getTimestamp()}.svg`;
    
    // Create Blob and Object URL
    let blob = new Blob([minimalSvgString], {type: 'image/svg+xml'});
    link.href = URL.createObjectURL(blob);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up Object URL
    
    console.log("Minimal multi-view SVG fallback exported");
    alert("Multi-view SVG export feature is currently unavailable. A basic fallback SVG has been downloaded.");

  } catch (error) {
    console.error("Minimal Multi-view SVG export failed:", error);
    alert("Multi-view SVG export failed completely. Please try taking a screenshot instead.");
  }
}

// Helper function to get timestamp
function getTimestamp() {
  let now = new Date();
  return now.getFullYear() + 
         pad(now.getMonth() + 1) + 
         pad(now.getDate()) + "_" + 
         pad(now.getHours()) + 
         pad(now.getMinutes()) + 
         pad(now.getSeconds());
}

// Helper function to pad numbers with leading zeros
function pad(num) {
  return num.toString().padStart(2, '0');
}

// Handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Function to set view based on button press
function setView(view) {
  if (!enable3DView) {
    enable3DView = true;
    document.getElementById("enable3D-toggle").checked = true;
  }
  
  switch(view) {
    case 'front':
      rotX = 0;
      rotY = 0;
      transX = 0;
      transY = 0;
      break;
    case 'back':
      rotX = 0;
      rotY = Math.PI;
      transX = 0;
      transY = 0;
      break;
    case 'left':
      rotX = 0;
      rotY = -Math.PI/2;
      transX = 0;
      transY = 0;
      break;
    case 'right':
      rotX = 0;
      rotY = Math.PI/2;
      transX = 0;
      transY = 0;
      break;
    case 'top':
      rotX = -Math.PI/2;
      rotY = 0;
      transX = 0;
      transY = 0;
      break;
    case 'bottom':
      rotX = Math.PI/2;
      rotY = 0;
      transX = 0;
      transY = 0;
      break;
    case 'reset':
      rotX = 0;
      rotY = 0;
      transX = 0;
      transY = 0;
      zoom = 1.0;
      break;
  }
}

// Mouse interaction for 3D view
function mousePressed() {
  if (enable3DView) {
    // Record initial mouse position only if over the sketch window and not over controls
    if (!mouseOverControls()) {
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  }
}

function mouseDragged() {
  if (enable3DView && !mouseOverControls()) {
    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;

    if (mouseButton === LEFT) { // Rotation
      rotY += dx * 0.01; // Adjust sensitivity as needed
      rotX -= dy * 0.01;
    } else if (mouseButton === RIGHT) { // Translation (Pan)
      transX += dx;
      transY += dy;
    }
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseWheel(event) {
  if (enable3DView && !mouseOverControls()) {
    let count = event.delta > 0 ? 1 : -1;
    zoom *= pow(0.95, count); // Adjust zoom sensitivity
    zoom = max(0.1, zoom); // Prevent zooming too far in/out
    return false; // Prevent default scrolling
  }
}

// Function to check if mouse is over controls
function mouseOverControls() {
  // Simple check if mouse is in the controls panel area
  let controlsPanel = document.querySelector(".controls");
  if (controlsPanel) {
    let rect = controlsPanel.getBoundingClientRect();
    return mouseX >= rect.left && mouseX <= rect.right && 
           mouseY >= rect.top && mouseY <= rect.bottom;
  }
  return false;
}
