// Define SVG constant explicitly for p5.js-svg library
const SVG = 'svg';

// Flag to track DOM loading state
let domLoaded = false;

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  domLoaded = true;
});

// Basic pattern parameters
let n = 7; // Number of points
let offset = 2.0; // Offset for the radius
let radiusScale = 50; // Scale factor for the radius units
let minPoints = 3;

// Duplication parameters
let cycleCount = 100; // Total duplicates in one shrink-then-grow cycle
let numberOfCycles = 1; // Number of times to repeat the cycle
let initialScaleOffset = 1.1; 
let scaleDecay = 0.9;       
let fluctuationAmount = 0.1;
let drawMode = 0; // 0 = curves, 1 = radial lines
let radialLineLengthUnits = 0.05;
let segmentsPerCurve = 100; // Number of radial lines per curve path
let lineRotationDegrees = 15.0; // Rotation angle for each set of lines in degrees

// Moiré effect parameters
let enableMoireEffect = true; // Toggle for moiré effect
let numLayers = 2; // Number of overlapping pattern layers
let layerRotationOffset = 3.0; // Rotation offset between layers (degrees)
let layerScaleOffset = 0.02; // Scale offset between layers
let layerPointOffset = 0; // Point count offset between layers
let layerCenterOffsets = []; // Array to store center offsets for each layer
let layerAlphas = []; // Array for layer transparency

// Data structures for storing random values
let points = []; // Stores calculated positions
let baseRandomDistances = []; // Stores random distance (1-7) for base shape
let fluctuationOffsets = []; // Stores random factor (-1 to 1) for fluctuation [duplicate][point]
let customPointsCache = {}; // Cache for custom point counts to prevent shifting

// Rendering and UI
let canvas;
let debugScaling = false; // Flag to control debug output for scaling calculations
let recordSVG = false; // Flag to trigger SVG export

function setup() {
  // Create canvas that fits the window
  canvas = createCanvas(windowWidth - 375, windowHeight);
  canvas.position(0, 0);
  
  // Initialize arrays for Moiré effect
  for (let i = 0; i < numLayers; i++) {
    layerCenterOffsets[i] = createVector(i * 10, i * 10); // Default offset
    layerAlphas[i] = 150; // Default alpha (0-255)
  }
  
  // Ensure DOM is loaded before setting up UI
  if (domLoaded) {
    setupUI();
  } else {
    // Wait for DOM to be loaded
    document.addEventListener('DOMContentLoaded', setupUI);
  }
  
  // Generate initial pattern
  regeneratePattern();
}

// Set up all UI elements and event listeners
function setupUI() {
  console.log("Setting up UI controls");
  // Set up event listeners for UI controls
  setupEventListeners();
  // Initialize UI with current values
  updateUIFromValues();
}

function setupEventListeners() {
  // Basic Pattern Parameters
  setupParameterControls("n", 0);
  setupParameterControls("offset", 1);
  setupParameterControls("radiusScale", 0);
  
  // Duplication Parameters
  setupParameterControls("cycleCount", 0);
  setupParameterControls("numberOfCycles", 0);
  setupParameterControls("initialScaleOffset", 2);
  setupParameterControls("scaleDecay", 2);
  setupParameterControls("fluctuationAmount", 2);
  
  // Drawing Mode Parameters
  document.getElementById("drawMode-select").addEventListener("change", function() {
    drawMode = parseInt(this.value);
  });
  setupParameterControls("radialLineLengthUnits", 2);
  setupParameterControls("segmentsPerCurve", 0);
  setupParameterControls("lineRotationDegrees", 1);
  
  // Moiré Effect Parameters
  document.getElementById("enableMoireEffect-toggle").addEventListener("change", function() {
    enableMoireEffect = this.checked;
  });
  setupParameterControls("numLayers", 0);
  setupParameterControls("layerRotationOffset", 1);
  setupParameterControls("layerScaleOffset", 3);
  setupParameterControls("layerPointOffset", 0);
  
  // Button event listeners
  document.getElementById("regenerate-btn").addEventListener("click", regeneratePattern);
  document.getElementById("export-svg").addEventListener("click", exportSVG);
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
      case "n": return n;
      case "offset": return offset;
      case "radiusScale": return radiusScale;
      case "cycleCount": return cycleCount;
      case "numberOfCycles": return numberOfCycles;
      case "initialScaleOffset": return initialScaleOffset;
      case "scaleDecay": return scaleDecay;
      case "fluctuationAmount": return fluctuationAmount;
      case "radialLineLengthUnits": return radialLineLengthUnits;
      case "segmentsPerCurve": return segmentsPerCurve;
      case "lineRotationDegrees": return lineRotationDegrees;
      case "numLayers": return numLayers;
      case "layerRotationOffset": return layerRotationOffset;
      case "layerScaleOffset": return layerScaleOffset;
      case "layerPointOffset": return layerPointOffset;
      default: return null;
    }
  };
  
  // Set variable based on parameter name
  const setVarValue = (value) => {
    switch(paramName) {
      case "n": 
        n = Math.max(minPoints, parseInt(value)); 
        calculatePoints();
        break;
      case "offset": 
        offset = value; 
        calculatePoints();
        break;
      case "radiusScale": 
        radiusScale = value; 
        calculatePoints();
        break;
      case "cycleCount": cycleCount = Math.max(2, parseInt(value)); break;
      case "numberOfCycles": numberOfCycles = Math.max(1, parseInt(value)); break;
      case "initialScaleOffset": initialScaleOffset = Math.max(1.01, value); break;
      case "scaleDecay": scaleDecay = Math.max(0.01, Math.min(0.99, value)); break;
      case "fluctuationAmount": fluctuationAmount = Math.max(0, value); break;
      case "radialLineLengthUnits": radialLineLengthUnits = Math.max(0.01, value); break;
      case "segmentsPerCurve": segmentsPerCurve = Math.max(5, parseInt(value)); break;
      case "lineRotationDegrees": lineRotationDegrees = value; break;
      case "numLayers": 
        numLayers = Math.max(1, parseInt(value)); 
        updateLayerArrays();
        break;
      case "layerRotationOffset": layerRotationOffset = value; break;
      case "layerScaleOffset": layerScaleOffset = value; break;
      case "layerPointOffset": layerPointOffset = parseInt(value); break;
    }
  };
  
  // Format value for display
  const formatValue = (value) => {
    return decimalPlaces > 0 ? value.toFixed(decimalPlaces) : value.toString();
  };
  
  // Initialize the UI elements with current values
  const currentValue = getVarRef();
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);
  const input = document.getElementById(inputId);
  
  if (slider && display && input) {
    slider.value = currentValue;
    display.textContent = formatValue(currentValue);
    input.value = currentValue;
    
    // Handle slider input
    slider.addEventListener("input", function() {
      const newValue = parseFloat(this.value);
      setVarValue(newValue);
      display.textContent = formatValue(newValue);
      input.value = newValue;
    });
    
    // Handle direct numeric input
    input.addEventListener("input", function() {
      // Check if the input is valid
      const newValue = parseFloat(this.value);
      if (!isNaN(newValue)) {
        setVarValue(newValue);
        display.textContent = formatValue(newValue);
        slider.value = newValue;
      }
    });
  } else {
    console.error(`Could not find UI elements for parameter: ${paramName}`);
  }
}

function updateLayerArrays() {
  // Update the arrays for the current numLayers
  if (layerCenterOffsets.length != numLayers) {
    const newOffsets = [];
    const newAlphas = [];
    
    // Copy existing values where possible
    for (let i = 0; i < numLayers; i++) {
      if (i < layerCenterOffsets.length) {
        newOffsets[i] = layerCenterOffsets[i];
        newAlphas[i] = layerAlphas[i];
      } else {
        newOffsets[i] = createVector(i * 10, i * 10); // Default offset
        newAlphas[i] = 150; // Default alpha (0-255)
      }
    }
    
    layerCenterOffsets = newOffsets;
    layerAlphas = newAlphas;
  }
}

// Reset parameters to defaults
function resetParameters() {
  n = 7;
  offset = 2.0;
  radiusScale = 50;
  cycleCount = 100;
  numberOfCycles = 1;
  initialScaleOffset = 1.1;
  scaleDecay = 0.9;
  fluctuationAmount = 0.1;
  drawMode = 0;
  radialLineLengthUnits = 0.05;
  segmentsPerCurve = 100;
  lineRotationDegrees = 15.0;
  enableMoireEffect = true;
  numLayers = 2;
  layerRotationOffset = 3.0;
  layerScaleOffset = 0.02;
  layerPointOffset = 0;
  
  // Update arrays
  updateLayerArrays();
  
  // Update UI controls
  updateUIFromValues();
  
  // Regenerate pattern with new values
  regeneratePattern();
}

// Update UI to match current parameter values
function updateUIFromValues() {
  updateControl("n", n, 0);
  updateControl("offset", offset, 1);
  updateControl("radiusScale", radiusScale, 0);
  updateControl("cycleCount", cycleCount, 0);
  updateControl("numberOfCycles", numberOfCycles, 0);
  updateControl("initialScaleOffset", initialScaleOffset, 2);
  updateControl("scaleDecay", scaleDecay, 2);
  updateControl("fluctuationAmount", fluctuationAmount, 2);
  document.getElementById("drawMode-select").value = drawMode;
  updateControl("radialLineLengthUnits", radialLineLengthUnits, 2);
  updateControl("segmentsPerCurve", segmentsPerCurve, 0);
  updateControl("lineRotationDegrees", lineRotationDegrees, 1);
  document.getElementById("enableMoireEffect-toggle").checked = enableMoireEffect;
  updateControl("numLayers", numLayers, 0);
  updateControl("layerRotationOffset", layerRotationOffset, 1);
  updateControl("layerScaleOffset", layerScaleOffset, 3);
  updateControl("layerPointOffset", layerPointOffset, 0);
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

// Function to generate and store all random values
function regeneratePattern() {
  console.log("Regenerating pattern...");
  cycleCount = max(2, cycleCount);
  numberOfCycles = max(1, numberOfCycles);
  let totalDuplicates = cycleCount * numberOfCycles;
  
  // Update arrays for Moiré layers
  updateLayerArrays();
  
  baseRandomDistances = [];
  fluctuationOffsets = [];
  customPointsCache = {}; // Clear the custom points cache

  // Generate base distances
  for (let i = 0; i < n; i++) {
    baseRandomDistances.push(random(1, 7));
  }

  // Generate fluctuation offsets for all potential duplicates
  for (let d = 0; d < totalDuplicates; d++) {
    let currentDuplicateOffsets = [];
    for (let i = 0; i < n; i++) {
      currentDuplicateOffsets.push(random(-1, 1)); // Store factor -1 to 1
    }
    fluctuationOffsets.push(currentDuplicateOffsets);
  }
  
  calculatePoints(); // Calculate positions based on new random data
  
  // Pre-generate custom points for each potential layer point count
  if (enableMoireEffect && layerPointOffset != 0) {
    for (let layer = 0; layer < numLayers; layer++) {
      let layerN = n + (layer * layerPointOffset);
      if (layerN >= minPoints && !customPointsCache[layerN]) {
        // Calculate center position
        let center = createVector(width / 2.0, height / 2.0);
        // Generate and cache the custom points
        customPointsCache[layerN] = generateCustomPoints(center, layerN);
      }
    }
  }
}

// Calculate point positions using stored random base distances
function calculatePoints() {
  n = max(minPoints, n); // Ensure n is valid
  // Ensure baseRandomDistances list matches current n (important if n changed)
  while (baseRandomDistances.length < n) baseRandomDistances.push(random(1, 7));
  while (baseRandomDistances.length > n) baseRandomDistances.pop();

  // Update textfield if clamped
  if (n !== parseInt(document.getElementById("n-input").value)) {
    document.getElementById("n-input").value = n;
    document.getElementById("n-display").textContent = n;
    document.getElementById("n-value").value = n;
  }

  points = []; // Clear previous positions
  let centerX = width / 2.0;
  let centerY = height / 2.0;
  for (let i = 0; i < n; i++) {
    let angle = map(i, 0, n, 0, TWO_PI);
    let baseDist = baseRandomDistances[i]; // Use stored random value
    let dist = (baseDist + offset) * radiusScale;
    let x = centerX + cos(angle) * dist;
    let y = centerY + sin(angle) * dist;
    points.push(createVector(x, y));
  }
}

// Use stored fluctuation offset
function getFluctuatedScaledPoint(originalPoint, center, totalScale, 
                               duplicateIndex, pointIndex, 
                               fluctAmountUnits, scaleUnits) 
{
  let scaledP = p5.Vector.sub(originalPoint, center);
  scaledP.mult(totalScale);
  scaledP.add(center);

  let dir = p5.Vector.sub(originalPoint, center);
  if (dir.magSq() > 1e-6) {
    dir.normalize();
    
    // Get stored fluctuation factor
    let fluctFactor = 0;
    // Check bounds before accessing fluctuationOffsets
    if (duplicateIndex >= 0 && duplicateIndex < fluctuationOffsets.length) {
       let currentDupOffsets = fluctuationOffsets[duplicateIndex];
       if (pointIndex >= 0 && pointIndex < currentDupOffsets.length) {
            fluctFactor = currentDupOffsets[pointIndex];
       }
    }

    let randFluctPixels = fluctFactor * fluctAmountUnits * scaleUnits;
    let fluctVec = p5.Vector.mult(dir, randFluctPixels);
    scaledP.add(fluctVec); 
  }
  return scaledP;
}

// Generate a set of custom points with the specified count
function generateCustomPoints(center, customN) {
  // Check if we already have cached points for this count
  if (customPointsCache[customN]) {
    return customPointsCache[customN];
  }
  
  let customPoints = [];
  
  // Use a fixed seed for consistent randomness based on customN
  randomSeed(customN * 10000 + 12345);
  
  // Generate random distances for this point count
  let customDists = [];
  for (let i = 0; i < customN; i++) {
    customDists.push(random(1, 7));
  }
  
  // Reset the random seed to avoid affecting other randomness
  randomSeed(millis());
  
  // Calculate positions
  for (let i = 0; i < customN; i++) {
    let angle = map(i, 0, customN, 0, TWO_PI);
    let baseDist = customDists[i];
    let dist = (baseDist + offset) * radiusScale;
    let x = center.x + cos(angle) * dist;
    let y = center.y + sin(angle) * dist;
    customPoints.push(createVector(x, y));
  }
  
  // Cache the result
  customPointsCache[customN] = customPoints;
  
  return customPoints;
}

// Simple scaling of a point around a center
function scalePoint(originalPoint, center, scale) {
  let result = p5.Vector.sub(originalPoint, center);
  result.mult(scale);
  result.add(center);
  return result;
}

// Main draw function
function draw() {
  background(255);
  
  if (points.length >= n && n >= minPoints) {
    // Draw pattern (or multiple patterns for moiré effect)
    if (enableMoireEffect && numLayers > 1) {
      // Draw each layer with its own transformations for moiré effect
      for (let layer = 0; layer < numLayers; layer++) {
        // Create a graphics buffer for this layer
        let layerBuffer = createGraphics(width, height);
        layerBuffer.background(255, 0); // Transparent background
        
        // Set up the drawing style
        layerBuffer.stroke(0, layerAlphas[layer]);
        layerBuffer.strokeWeight(1);
        layerBuffer.noFill();
        
        // Calculate the center for this layer with offset
        let layerCenter = createVector(
          width / 2.0 + layerCenterOffsets[layer].x,
          height / 2.0 + layerCenterOffsets[layer].y
        );
        
        // Calculate effective parameters for this layer
        let layerN = n + (layer * layerPointOffset);
        layerN = max(minPoints, layerN);
        let layerRotation = layer * layerRotationOffset;
        let layerScale = 1.0 + (layer * layerScaleOffset);
        
        // Draw the pattern with layer-specific transformations
        drawPatternWithTransform(layerBuffer, layerCenter, layerRotation, layerScale, layerN);
        
        // Draw the layer to the main canvas
        image(layerBuffer, 0, 0);
      }
    } else {
      // Draw a single pattern (no moiré effect)
      stroke(0);
      strokeWeight(1);
      noFill();
      let center = createVector(width / 2.0, height / 2.0);
      drawPattern(center);
    }
  }
}

// Draw pattern with transformations (for layered moiré effect)
function drawPatternWithTransform(g, center, rotation, scale, pointCount) {
  g.push();
  
  // Apply rotation around the pattern center
  if (rotation != 0) {
    g.translate(center.x, center.y);
    g.rotate(radians(rotation));
    g.translate(-center.x, -center.y);
  }
  
  // Draw a modified pattern with specified parameters
  if (points.length >= n && n >= minPoints) {
    // Variables needed by both draw modes
    let radialLengthPixels = radialLineLengthUnits * radiusScale * scale;
    let numSegments = max(1, segmentsPerCurve);

    // Draw Original Curve (or its radial lines)
    if (drawMode == 0) {
      // Draw CURVES Mode - Original curve
      if (pointCount == n) {
        // Can use the original points with scaling
        drawScaledCurve(g, center, scale);
      } else {
        // Need to calculate different points
        drawCustomCurve(g, center, pointCount, scale);
      }
    } else {
      // Draw INTERPOLATED INWARD RADIAL LINES Mode - Original curve
      if (pointCount == n) {
        drawScaledRadialLines(g, center, numSegments, radialLengthPixels, scale);
      } else {
        drawCustomRadialLines(g, center, pointCount, numSegments, radialLengthPixels, scale);
      }
    }

    // --- Draw Duplicate Cycles (Multiplicative Scaling) --- 
    let effectiveCycleCount = max(2, cycleCount);
    let effectiveNumCycles = max(1, numberOfCycles);
    
    let halfCycle = floor(effectiveCycleCount / 2);
    let firstRelativeOffset = max(0.01, initialScaleOffset - 1.0);
    
    let currentTotalScale = scale; // Start with the layer scale

    // Outer loop for cycles
    for (let cycleNum = 0; cycleNum < effectiveNumCycles; cycleNum++) {
      // Inner loop for steps within a cycle
      for (let d = 0; d < effectiveCycleCount; d++) { 
        let exponentIndex = (d < halfCycle) ? d : (effectiveCycleCount - 1 - d);
        let stepScaleFactor = 1.0 + firstRelativeOffset * pow(scaleDecay, exponentIndex); 
        currentTotalScale *= stepScaleFactor; 

        if (currentTotalScale <= 1e-6) {
          continue; 
        }

        let totalDuplicateIndex = cycleNum * effectiveCycleCount + d;

        if (drawMode == 0) {
          // Draw curve with current scale
          drawFluctuatedCurve(g, center, currentTotalScale, totalDuplicateIndex);
        } else {
          // Draw radial lines with current scale
          let currentAnchorPoints = [];
          for(let i = 0; i < n; i++) {
            currentAnchorPoints.push(getFluctuatedScaledPoint(points[i], center, currentTotalScale, totalDuplicateIndex, i, fluctuationAmount, radiusScale));
          }
          
          // Calculate rotation for this set of lines
          let rotationAngle = radians(lineRotationDegrees * totalDuplicateIndex);
          
          for (let j = 0; j < numSegments; j++) {
            let t_global = map(j, 0, numSegments, 0, n);
            let segIndex = floor(t_global) % n;
            let t_segment = t_global - floor(t_global);
            
            let p0 = currentAnchorPoints[(segIndex - 1 + n) % n];
            let p1 = currentAnchorPoints[segIndex];
            let p2 = currentAnchorPoints[(segIndex + 1) % n];
            let p3 = currentAnchorPoints[(segIndex + 2) % n];
            
            let interpX = curvePoint(p0.x, p1.x, p2.x, p3.x, t_segment);
            let interpY = curvePoint(p0.y, p1.y, p2.y, p3.y, t_segment);
            
            // Use the rotated line drawing function
            drawRotatedRadialLine(g, createVector(interpX, interpY), center, radialLengthPixels, rotationAngle);
          }
        }
      }
    }
  }
  
  g.pop();
}

// New method to encapsulate all pattern drawing logic
function drawPattern(center) {
  // Variables needed by both draw modes
  let radialLengthPixels = radialLineLengthUnits * radiusScale;
  let numSegments = max(1, segmentsPerCurve);

  // Draw Original Curve (or its radial lines)
  if (drawMode == 0) {
      // Draw CURVES Mode - Original curve
      beginShape();
      curveVertex(points[n - 1].x, points[n - 1].y); 
      for (let i = 0; i < n; i++) {
        curveVertex(points[i].x, points[i].y);
      }
      curveVertex(points[0].x, points[0].y);
      curveVertex(points[1].x, points[1].y); 
      endShape();
  } else {
      // Draw INTERPOLATED INWARD RADIAL LINES Mode - Original curve
      for (let j = 0; j < numSegments; j++) {
          let t_global = map(j, 0, numSegments, 0, n);
          let segIndex = floor(t_global) % n;
          let t_segment = t_global - floor(t_global);
          
          let p0 = points[(segIndex - 1 + n) % n];
          let p1 = points[segIndex];
          let p2 = points[(segIndex + 1) % n];
          let p3 = points[(segIndex + 2) % n];
          
          let interpX = curvePoint(p0.x, p1.x, p2.x, p3.x, t_segment);
          let interpY = curvePoint(p0.y, p1.y, p2.y, p3.y, t_segment);
          drawInwardRadialLine(createVector(interpX, interpY), center, radialLengthPixels);
      }
  }

  // --- Draw Duplicate Cycles (Multiplicative Scaling) --- 
  let effectiveCycleCount = max(2, cycleCount);
  let effectiveNumCycles = max(1, numberOfCycles);
  
  let halfCycle = floor(effectiveCycleCount / 2);
  let firstRelativeOffset = max(0.01, initialScaleOffset - 1.0);
  
  // For each cycle, start with scale 1.0
  let currentTotalScale = 1.0;

  // Outer loop for cycles
  for (let cycleNum = 0; cycleNum < effectiveNumCycles; cycleNum++) {
      // Inner loop for steps within a cycle
      for (let d = 0; d < effectiveCycleCount; d++) { 
          let exponentIndex = (d < halfCycle) ? d : (effectiveCycleCount - 1 - d);
          let stepScaleFactor = 1.0 + firstRelativeOffset * pow(scaleDecay, exponentIndex); 
          currentTotalScale *= stepScaleFactor; 

          if (currentTotalScale <= 1e-6) {
              continue; 
          }

          let totalDuplicateIndex = cycleNum * effectiveCycleCount + d;

          if (drawMode == 0) {
              // Draw curve with current scale
              drawFluctuatedCurve(this, center, currentTotalScale, totalDuplicateIndex);
          } else {
              // Draw radial lines with current scale
              let currentAnchorPoints = [];
              for(let i = 0; i < n; i++) {
                  currentAnchorPoints.push(getFluctuatedScaledPoint(points[i], center, currentTotalScale, totalDuplicateIndex, i, fluctuationAmount, radiusScale));
              }
              
              // Calculate rotation for this set of lines
              let rotationAngle = radians(lineRotationDegrees * totalDuplicateIndex);
              
              for (let j = 0; j < numSegments; j++) {
                  let t_global = map(j, 0, numSegments, 0, n);
                  let segIndex = floor(t_global) % n;
                  let t_segment = t_global - floor(t_global);
                  
                  let p0 = currentAnchorPoints[(segIndex - 1 + n) % n];
                  let p1 = currentAnchorPoints[segIndex];
                  let p2 = currentAnchorPoints[(segIndex + 1) % n];
                  let p3 = currentAnchorPoints[(segIndex + 2) % n];
                  
                  let interpX = curvePoint(p0.x, p1.x, p2.x, p3.x, t_segment);
                  let interpY = curvePoint(p0.y, p1.y, p2.y, p3.y, t_segment);
                  
                  // Use the rotated line drawing function
                  drawRotatedRadialLine(this, createVector(interpX, interpY), center, radialLengthPixels, rotationAngle);
              }
          }
      }
  }
}

// Helper methods for drawing various curve elements
function drawFluctuatedCurve(g, center, totalScale, duplicateIndex) {
    if (totalScale <= 1e-6) return; // Skip if scale is too small/negative
    if (points.length < n || n < minPoints) return; // Safety checks

    g.beginShape();
    // Control points (indices n-1, 0, 1)
    let fluctuatedLastP = getFluctuatedScaledPoint(points[n - 1], center, totalScale, duplicateIndex, n - 1, fluctuationAmount, radiusScale);
    g.curveVertex(fluctuatedLastP.x, fluctuatedLastP.y);

    // Main points (indices 0 to n-1)
    for (let i = 0; i < n; i++) {
        let fluctuatedP = getFluctuatedScaledPoint(points[i], center, totalScale, duplicateIndex, i, fluctuationAmount, radiusScale);
        g.curveVertex(fluctuatedP.x, fluctuatedP.y);
    }

    // Closing control points (indices 0, 1)
    let fluctuatedFirstP = getFluctuatedScaledPoint(points[0], center, totalScale, duplicateIndex, 0, fluctuationAmount, radiusScale);
    g.curveVertex(fluctuatedFirstP.x, fluctuatedFirstP.y);
    let fluctuatedSecondP = getFluctuatedScaledPoint(points[1], center, totalScale, duplicateIndex, 1, fluctuationAmount, radiusScale);
    g.curveVertex(fluctuatedSecondP.x, fluctuatedSecondP.y);

    g.endShape();
}

// Helper function to draw a short radial line *inward* from a point towards the center
function drawInwardRadialLine(point, center, lengthPixels) {
    let dirToCenter = p5.Vector.sub(center, point);
    if (dirToCenter.magSq() < 1e-6) return; // Avoid drawing for points at the center
    dirToCenter.normalize();
    let endPoint = p5.Vector.add(point, p5.Vector.mult(dirToCenter, lengthPixels)); // Move towards center
    line(point.x, point.y, endPoint.x, endPoint.y);
}

// Helper function to draw a rotated radial line
function drawRotatedRadialLine(g, point, center, lengthPixels, rotationAngleRadians) {
    let dirToCenter = p5.Vector.sub(center, point);
    if (dirToCenter.magSq() < 1e-6) return; // Avoid drawing for points at the center
    dirToCenter.normalize();
    
    // Calculate rotated direction
    let rotatedDir = createVector(
        dirToCenter.x * cos(rotationAngleRadians) - dirToCenter.y * sin(rotationAngleRadians),
        dirToCenter.x * sin(rotationAngleRadians) + dirToCenter.y * cos(rotationAngleRadians)
    );
    
    // Calculate the line end point
    let endPoint = p5.Vector.add(point, p5.Vector.mult(rotatedDir, lengthPixels));
    
    g.line(point.x, point.y, endPoint.x, endPoint.y);
}

// Draw a curve with a custom number of points
function drawCustomCurve(g, center, customN, scale) {
  let customPoints = generateCustomPoints(center, customN);
  
  g.beginShape();
  // Control points
  let scaledLastP = scalePoint(customPoints[customN - 1], center, scale);
  g.curveVertex(scaledLastP.x, scaledLastP.y);

  // Main points
  for (let i = 0; i < customN; i++) {
    let scaledP = scalePoint(customPoints[i], center, scale);
    g.curveVertex(scaledP.x, scaledP.y);
  }

  // Closing control points
  let scaledFirstP = scalePoint(customPoints[0], center, scale);
  g.curveVertex(scaledFirstP.x, scaledFirstP.y);
  let scaledSecondP = scalePoint(customPoints[1], center, scale);
  g.curveVertex(scaledSecondP.x, scaledSecondP.y);

  g.endShape();
}

// Draw scaled curve with the original number of points
function drawScaledCurve(g, center, scale) {
  g.beginShape();
  // Control points (indices n-1, 0, 1)
  let scaledLastP = scalePoint(points[n - 1], center, scale);
  g.curveVertex(scaledLastP.x, scaledLastP.y);

  // Main points (indices 0 to n-1)
  for (let i = 0; i < n; i++) {
    let scaledP = scalePoint(points[i], center, scale);
    g.curveVertex(scaledP.x, scaledP.y);
  }

  // Closing control points (indices 0, 1)
  let scaledFirstP = scalePoint(points[0], center, scale);
  g.curveVertex(scaledFirstP.x, scaledFirstP.y);
  let scaledSecondP = scalePoint(points[1], center, scale);
  g.curveVertex(scaledSecondP.x, scaledSecondP.y);

  g.endShape();
}

// Draw radial lines with scaling
function drawScaledRadialLines(g, center, numSegments, radialLengthPixels, scale) {
  for (let j = 0; j < numSegments; j++) {
    let t_global = map(j, 0, numSegments, 0, n);
    let segIndex = floor(t_global) % n;
    let t_segment = t_global - floor(t_global);
    
    let p0 = scalePoint(points[(segIndex - 1 + n) % n], center, scale);
    let p1 = scalePoint(points[segIndex], center, scale);
    let p2 = scalePoint(points[(segIndex + 1) % n], center, scale);
    let p3 = scalePoint(points[(segIndex + 2) % n], center, scale);
    
    let interpX = curvePoint(p0.x, p1.x, p2.x, p3.x, t_segment);
    let interpY = curvePoint(p0.y, p1.y, p2.y, p3.y, t_segment);
    drawInwardRadialLine(createVector(interpX, interpY), center, radialLengthPixels);
  }
}

// Draw radial lines with custom point count
function drawCustomRadialLines(g, center, customN, numSegments, radialLengthPixels, scale) {
  let customPoints = generateCustomPoints(center, customN);
  
  for (let j = 0; j < numSegments; j++) {
    let t_global = map(j, 0, numSegments, 0, customN);
    let segIndex = floor(t_global) % customN;
    let t_segment = t_global - floor(t_global);
    
    let p0 = scalePoint(customPoints[(segIndex - 1 + customN) % customN], center, scale);
    let p1 = scalePoint(customPoints[segIndex], center, scale);
    let p2 = scalePoint(customPoints[(segIndex + 1) % customN], center, scale);
    let p3 = scalePoint(customPoints[(segIndex + 2) % customN], center, scale);
    
    let interpX = curvePoint(p0.x, p1.x, p2.x, p3.x, t_segment);
    let interpY = curvePoint(p0.y, p1.y, p2.y, p3.y, t_segment);
    drawInwardRadialLine(createVector(interpX, interpY), center, radialLengthPixels);
  }
}

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth - 375, windowHeight);
  let center = createVector(width / 2.0, height / 2.0);
  calculatePoints(); // Recalculate points for new canvas size
}

// Export SVG file
function exportSVG() {
  console.log("Exporting SVG...");
  
  try {
    // Create a timestamp for the filename
    let timestamp = getTimestamp();
    let filename = `InterpolatedMoire_${timestamp}.svg`;
    
    // Create a temporary off-screen graphics buffer for SVG
    let svg = createGraphics(width, height, SVG);
    svg.background(255);
    
    // Set up drawing styles
    svg.noFill();
    svg.stroke(0);
    svg.strokeWeight(1);
    
    // Draw the pattern to the SVG
    if (enableMoireEffect && numLayers > 1) {
      // Draw each layer with its own transformations for moiré effect
      for (let layer = 0; layer < numLayers; layer++) {
        // Set up the drawing style
        svg.stroke(0, layerAlphas[layer]);
        
        // Calculate the center for this layer with offset
        let layerCenter = createVector(
          width / 2.0 + layerCenterOffsets[layer].x,
          height / 2.0 + layerCenterOffsets[layer].y
        );
        
        // Calculate effective parameters for this layer
        let layerN = n + (layer * layerPointOffset);
        layerN = max(minPoints, layerN);
        let layerRotation = layer * layerRotationOffset;
        let layerScale = 1.0 + (layer * layerScaleOffset);
        
        // Draw the pattern with layer-specific transformations
        drawPatternWithTransform(svg, layerCenter, layerRotation, layerScale, layerN);
      }
    } else {
      // Draw a single pattern (no moiré effect)
      let center = createVector(width / 2.0, height / 2.0);
      
      // Need to use the svg graphics object, not 'this'
      svg.push();
      drawPatternToGraphics(svg, center);
      svg.pop();
    }
    
    // Save the SVG file
    save(svg, filename);
    console.log(`SVG saved as: ${filename}`);
    
    // Provide feedback to the user
    alert(`SVG exported as: ${filename}`);
  } catch (error) {
    console.error("SVG export failed:", error);
    alert("SVG export failed. Please check the console for details.");
  }
}

// Draw pattern directly to a graphics object (for SVG export)
function drawPatternToGraphics(g, center) {
  // Variables needed by both draw modes
  let radialLengthPixels = radialLineLengthUnits * radiusScale;
  let numSegments = max(1, segmentsPerCurve);

  // Draw Original Curve (or its radial lines)
  if (drawMode == 0) {
    // Draw CURVES Mode - Original curve
    g.beginShape();
    g.curveVertex(points[n - 1].x, points[n - 1].y); 
    for (let i = 0; i < n; i++) {
      g.curveVertex(points[i].x, points[i].y);
    }
    g.curveVertex(points[0].x, points[0].y);
    g.curveVertex(points[1].x, points[1].y); 
    g.endShape();
  } else {
    // Draw INTERPOLATED INWARD RADIAL LINES Mode - Original curve
    for (let j = 0; j < numSegments; j++) {
      let t_global = map(j, 0, numSegments, 0, n);
      let segIndex = floor(t_global) % n;
      let t_segment = t_global - floor(t_global);
      
      let p0 = points[(segIndex - 1 + n) % n];
      let p1 = points[segIndex];
      let p2 = points[(segIndex + 1) % n];
      let p3 = points[(segIndex + 2) % n];
      
      let interpX = curvePoint(p0.x, p1.x, p2.x, p3.x, t_segment);
      let interpY = curvePoint(p0.y, p1.y, p2.y, p3.y, t_segment);
      
      // Draw to the graphics object
      let dirToCenter = p5.Vector.sub(center, createVector(interpX, interpY));
      if (dirToCenter.magSq() >= 1e-6) {
        dirToCenter.normalize();
        let endPoint = p5.Vector.add(createVector(interpX, interpY), p5.Vector.mult(dirToCenter, radialLengthPixels));
        g.line(interpX, interpY, endPoint.x, endPoint.y);
      }
    }
  }

  // --- Draw Duplicate Cycles (Multiplicative Scaling) --- 
  let effectiveCycleCount = max(2, cycleCount);
  let effectiveNumCycles = max(1, numberOfCycles);
  
  let halfCycle = floor(effectiveCycleCount / 2);
  let firstRelativeOffset = max(0.01, initialScaleOffset - 1.0);
  
  // For each cycle, start with scale 1.0
  let currentTotalScale = 1.0;

  // Outer loop for cycles
  for (let cycleNum = 0; cycleNum < effectiveNumCycles; cycleNum++) {
    // Inner loop for steps within a cycle
    for (let d = 0; d < effectiveCycleCount; d++) { 
      let exponentIndex = (d < halfCycle) ? d : (effectiveCycleCount - 1 - d);
      let stepScaleFactor = 1.0 + firstRelativeOffset * pow(scaleDecay, exponentIndex); 
      currentTotalScale *= stepScaleFactor; 

      if (currentTotalScale <= 1e-6) {
        continue; 
      }

      let totalDuplicateIndex = cycleNum * effectiveCycleCount + d;

      if (drawMode == 0) {
        // Draw curve with current scale
        drawFluctuatedCurve(g, center, currentTotalScale, totalDuplicateIndex);
      } else {
        // Draw radial lines with current scale
        let currentAnchorPoints = [];
        for(let i = 0; i < n; i++) {
          currentAnchorPoints.push(getFluctuatedScaledPoint(points[i], center, currentTotalScale, totalDuplicateIndex, i, fluctuationAmount, radiusScale));
        }
        
        // Calculate rotation for this set of lines
        let rotationAngle = radians(lineRotationDegrees * totalDuplicateIndex);
        
        for (let j = 0; j < numSegments; j++) {
          let t_global = map(j, 0, numSegments, 0, n);
          let segIndex = floor(t_global) % n;
          let t_segment = t_global - floor(t_global);
          
          let p0 = currentAnchorPoints[(segIndex - 1 + n) % n];
          let p1 = currentAnchorPoints[segIndex];
          let p2 = currentAnchorPoints[(segIndex + 1) % n];
          let p3 = currentAnchorPoints[(segIndex + 2) % n];
          
          let interpX = curvePoint(p0.x, p1.x, p2.x, p3.x, t_segment);
          let interpY = curvePoint(p0.y, p1.y, p2.y, p3.y, t_segment);
          
          // Use the rotated line drawing function
          drawRotatedRadialLine(g, createVector(interpX, interpY), center, radialLengthPixels, rotationAngle);
        }
      }
    }
  }
}

// Helper function to generate timestamp string
function getTimestamp() {
  let now = new Date();
  let year = now.getFullYear();
  let month = (now.getMonth() + 1).toString().padStart(2, '0');
  let day = now.getDate().toString().padStart(2, '0');
  let hour = now.getHours().toString().padStart(2, '0');
  let minute = now.getMinutes().toString().padStart(2, '0');
  let second = now.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}_${hour}${minute}${second}`;
}

// Handle key presses
function keyPressed() {
  if (key === 's' || key === 'S') {
    exportSVG();
  } else if (key === 'r' || key === 'R') {
    regeneratePattern();
  }
} 