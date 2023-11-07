
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

let scene = new THREE.Scene();
let clock = new THREE.Clock();

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.outputEncoding = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);


composer.addPass(bloomPass);


const bloomParams = {
  exposure: 1,
  bloomThreshold: 0.8,
  bloomStrength: 1.1,
  bloomRadius: 0.3
};

// Set the bloom parameters as needed
bloomPass.threshold = bloomParams.bloomThreshold
bloomPass.strength = bloomParams.bloomStrength
bloomPass.radius = bloomParams.bloomRadius



renderer.setSize(window.innerWidth, window.innerHeight);

let ambientLight = new THREE.AmbientLight(0xaa77ee, 0.5);
scene.add(ambientLight);




// Bees
let geometry = new THREE.DodecahedronGeometry(0.3); // Smaller bees
let mat = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true, // Enable transparency
  opacity: 1.0 // Full opacity initially
});
let instancedMesh = new THREE.InstancedMesh(geometry, mat, 160);

let dummy = new THREE.Object3D();
let origins = [];
let phases = [];
let baseSpeed = 0.005;
let speedModifiers = [];
let beeParams = [];

let randomFormulaOne = () => Math.random() * 50 - 25;
let randomFormulaTwo = () => Math.random() * Math.PI * 2;

// controls
const controls = new OrbitControls(camera, renderer.domElement);
const speed = 70000
controls.autoRotate = true;


controls.target.set(0, 0, 0);
let mainAnimStop = false;



// Explosion
const particleCount = 10000;
const boxGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const explosionMaterial = new THREE.MeshBasicMaterial({
  color: 0x33bbff,
  transparent: true, // Enable transparency
  opacity: 1.0 // Full opacity initially
});
const particles = new THREE.InstancedMesh(boxGeometry, explosionMaterial, particleCount);
scene.add(particles);

let maxDiameter = 200; // maximum radius of explosion
let timeToMax = 1; // time in seconds to reach maxDiameter
let cooldownTime = 3; // time in seconds to cool down to the average level

const exDummy = new THREE.Object3D();

// Create an array to store direction vectors for each particle
const scatterDirections = new Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  scatterDirections[i] = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  ).normalize(); // Normalize to ensure even distribution
}

function updateParticles() {
  const elapsedTime = clock.getElapsedTime() - 2; // Start with a 5 second delay
  if (elapsedTime < 0) return; // If we're still in the delay period, do nothing

  let progress = Math.min(elapsedTime / timeToMax, 1); // Progress of the explosion
  let isInCooldownPhase = elapsedTime > timeToMax;
  let cooldownProgress = isInCooldownPhase ? Math.min((elapsedTime - timeToMax) / cooldownTime, 1) : 0; // Cooldown progress

  for (let i = 0; i < particleCount; i++) {
    let distance = maxDiameter * (isInCooldownPhase ? (1 - cooldownProgress) : progress);
    distance *= Math.cbrt(Math.random()); // Fill the volume

    let angle = Math.random() * Math.PI * 2; // Random angle for x-y plane
    let heightAngle = Math.acos(2 * Math.random() - 1); // Random angle for z-axis

    // Calculate positions based on angles
    let x = distance * Math.sin(heightAngle) * Math.cos(angle);
    let y = distance * Math.sin(heightAngle) * Math.sin(angle);
    let z = distance * Math.cos(heightAngle);

    // Set the position
    exDummy.position.set(x, y, z);
    exDummy.updateMatrix();
    particles.setMatrixAt(i, exDummy.matrix);
  }

  // Hide particles after cooldown phase
  if (cooldownProgress >= 1) {
    particles.visible = false;
  } else {
    particles.instanceMatrix.needsUpdate = true;
  }
}




// TV

// Create a group for the entire TV
const tvGroup = new THREE.Group();


// Materials
const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x88aa44 });
const screenMaterial = new THREE.MeshPhongMaterial({ color: 0x444411, shininess: 100, specular: 0x222222 });
const crtScreenMaterial = new THREE.MeshPhongMaterial({ color: 0x226622, shininess: 100, specular: 0x888888 });
const buttonMaterial = new THREE.MeshPhongMaterial({ color: 0x77aadd });
const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
const antennaTopMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
const waveMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });

// TV body
const bodyGeometry = new THREE.BoxGeometry(5, 3, 1);
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
tvGroup.add(body);

// Beveled screen
const screenGeometry = new THREE.BoxGeometry(4.5, 2.5, 0.1);
const screenEdges = new THREE.EdgesGeometry(screenGeometry); // Create edges for the bevel
const screen = new THREE.Mesh(screenGeometry, screenMaterial);
screen.position.z = 0.51; // Slightly in front of the TV body to see the bevel
tvGroup.add(screen);

// Add beveled edges as a separate object
const bevelMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
const bevelEdges = new THREE.LineSegments(screenEdges, bevelMaterial);
bevelEdges.position.z = 0.51;
tvGroup.add(bevelEdges);


// Beveled edges for the body
const bodyEdges = new THREE.EdgesGeometry(bodyGeometry);
const bodyBevel = new THREE.LineSegments(bodyEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
tvGroup.add(bodyBevel);

// CRT Screen - using ExtrudeGeometry for a rectangle with rounded corners
const crtShape = new THREE.Shape();
const radius = 0.1; // Radius of the corners
const crtWidth = 3.2; // Width of the CRT
const crtHeight = 1.8; // Height of the CRT

// Starting point (bottom left after rounded corner)
crtShape.moveTo(-crtWidth / 2 + radius, -crtHeight / 2);

// Bottom line (left to right)
crtShape.lineTo(crtWidth / 2 - radius, -crtHeight / 2);

// Bottom right corner
crtShape.quadraticCurveTo(crtWidth / 2, -crtHeight / 2, crtWidth / 2, -crtHeight / 2 + radius);

// Right side line (bottom to top)
crtShape.lineTo(crtWidth / 2, crtHeight / 2 - radius);

// Top right corner
crtShape.quadraticCurveTo(crtWidth / 2, crtHeight / 2, crtWidth / 2 - radius, crtHeight / 2);

// Top line (right to left)
crtShape.lineTo(-crtWidth / 2 + radius, crtHeight / 2);

// Top left corner
crtShape.quadraticCurveTo(-crtWidth / 2, crtHeight / 2, -crtWidth / 2, crtHeight / 2 - radius);

// Left side line (top to bottom)
crtShape.lineTo(-crtWidth / 2, -crtHeight / 2 + radius);

// Bottom left corner
crtShape.quadraticCurveTo(-crtWidth / 2, -crtHeight / 2, -crtWidth / 2 + radius, -crtHeight / 2);

// Note that the last line is not necessary since moveTo implicitly creates it


const CRTextrudeSettings = {
  steps: 2,
  depth: 0.2,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.05,
  bevelSegments: 3
};

const crtGeometry = new THREE.ExtrudeGeometry(crtShape, CRTextrudeSettings);
crtGeometry.computeVertexNormals();

// Modify the vertices to achieve the curved CRT screen effect
const positions = crtGeometry.attributes.position;
const vertex = new THREE.Vector3();

for (let i = 0; i < positions.count; i++) {
  vertex.fromBufferAttribute(positions, i);
  if (vertex.z > 0.01) { // Offset vertices only if they are extruded
    const offset = (vertex.z / CRTextrudeSettings.depth) * 0.05; // The offset is larger for vertices that are further out
    vertex.x *= 1 - offset;
    vertex.y *= 1 - offset;
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
}

positions.needsUpdate = true; // Required after changing the positions

const crtScreen = new THREE.Mesh(crtGeometry, crtScreenMaterial);
crtScreen.position.x = -0.45; // Offset to the left to leave space for buttons
crtScreen.position.y = -0.01;
crtScreen.position.z = 0.51; // Positioning just in front of the TV body
tvGroup.add(crtScreen);

// ... (remaining code stays the same)


// Animated sound wave line
const waveGeometry = new THREE.BufferGeometry();
const wavePoints = [];
const waveWidth = crtWidth - 0.5;
const numWaveSegments = 128;
const waveIncrement = waveWidth / numWaveSegments;

for (let i = 0; i <= numWaveSegments; i++) {
  wavePoints.push(new THREE.Vector3(-waveWidth / 2 + i * waveIncrement, 0, 0));
}

waveGeometry.setFromPoints(wavePoints);
const waveLine = new THREE.Line(waveGeometry, waveMaterial);
waveLine.position.copy(crtScreen.position);
waveLine.position.z += 0.3; // In front of the CRT screen
waveLine.position.y += crtHeight / 2 - 0.8; // Align vertically
tvGroup.add(waveLine);


function simpleNoise(x, y) {
  return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
}

// Configuration variables
const animationSpeed = 0.0000005; // Slow down the animation by reducing the speed factor
const maxAmplitude = 0.3; // Increase the maximum amplitude

// Update function for the sound wave
function updateWave(time) {
  const positions = waveLine.geometry.attributes.position.array;
  
  for (let i = 0; i <= numWaveSegments; i++) {
    // Gaussian window function for amplitude modulation
    const gaussianFactor = Math.exp(-Math.pow(i - numWaveSegments / 2, 2) / (2 * Math.pow(numWaveSegments / 4, 2)));
    
    // Multi-layered noise for evolving complexity
    const layeredNoise = simpleNoise(i * 0.2, time * animationSpeed) * 0.5 +
                         simpleNoise(i * 0.05, time * animationSpeed * 2) * 1 +
                         simpleNoise(i * 0.01, time * animationSpeed * 4) * 0.25;
    
    // Varying frequency and phase
    const freq = 0.1 + 0.05 * simpleNoise(i * 0.1, time * animationSpeed);
    const phase = time * animationSpeed * 0.5 + 10 * simpleNoise(i * 0.1, time * animationSpeed);
    
    // Compute the new Y position of each point with configurable amplitude
    positions[i * 3 + 1] = Math.sin(i * freq + phase) * gaussianFactor * layeredNoise * maxAmplitude;
  }

  waveLine.geometry.attributes.position.needsUpdate = true;
}



// Buttons
for (let i = 0; i < 4; i++) {
  const buttonGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32);
  const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
  button.position.x = 1.75;
  button.position.y = 0.9 - i * 0.3;
  button.position.z = 0.6;
  button.rotation.x = Math.PI / 2;
  tvGroup.add(button);
}

// Antennas
for (let i = 0; i < 2; i++) {
  const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 32);
  const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antenna.position.x = (i - 0.5) * 2; // Position antennas left and right
  antenna.position.y = 2; // Position antennas on top of the TV
  antenna.position.z = 0.5;
  antenna.rotation.z = i === 1 ? - (Math.PI / 4) : Math.PI / 4;
  antenna.rotation.x = Math.PI / 4; // Angle the antennas
  tvGroup.add(antenna);

  // Antenna tops (dodecahedrons)
  const antennaTopGeometry = new THREE.DodecahedronGeometry(0.2);
  const antennaTop = new THREE.Mesh(antennaTopGeometry, antennaTopMaterial);
  antennaTop.position.x = antenna.position.x + (i - 0.5) * 2;
  antennaTop.position.y = antenna.position.y + 0.75;
  antennaTop.position.z = antenna.position.z + 0.8;
  tvGroup.add(antennaTop);
}

// Add the group to the scene
tvGroup.scale.set(3,3,3)


// TV ADD
scene.add(tvGroup);


function createLShapePart(length, isHorizontal, mat) {
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(isHorizontal ? length : 0, isHorizontal ? 0 : length, 0)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, mat);
}

function createSymmetricalLShape(size, mat) {
  const group = new THREE.Group();

  const horizontalLine = createLShapePart(size, true, mat);
  const verticalLine = createLShapePart(size, false, mat);

  verticalLine.position.x = size; // Position vertical line at the end of horizontal

  group.add(horizontalLine);
  group.add(verticalLine);

  return group;
}

function addLShapesToCorners(group, size, mat, distanceFromCenter) {
  const halfSize = size / 2;
  const offset = distanceFromCenter + halfSize;

  const lShapeTopRight = createSymmetricalLShape(size, mat);
  lShapeTopRight.rotation.z = Math.PI / 2 ;
  lShapeTopRight.position.set(offset - 1, offset - 0.5 - 1, 0);
  group.add(lShapeTopRight);

  const lShapeTopLeft = createSymmetricalLShape(size, mat);
  lShapeTopLeft.rotation.z = Math.PI ;
  lShapeTopLeft.position.set(-offset + 1 + 0.5, offset - 1, 0);
  group.add(lShapeTopLeft);

  const lShapeBottomLeft = createSymmetricalLShape(size, mat);
  lShapeBottomLeft.rotation.z = - Math.PI / 2;
  lShapeBottomLeft.position.set(-offset + 1, -offset + 1.5, 0);
  group.add(lShapeBottomLeft);

  const lShapeBottomRight = createSymmetricalLShape(size, mat);
  
  lShapeBottomRight.position.set(offset - 0.5 - 1, -offset + 1, 0);
  group.add(lShapeBottomRight);
}

function createTick(position, mat) {
  const tickGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(position, 0.1, 0),
    new THREE.Vector3(position, -0.1, 0)
  ]);
  return new THREE.Line(tickGeometry, mat);
}

function createLineWithTicks(length, mat) {
  const group = new THREE.Group();
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-length / 2, 0, 0), 
    new THREE.Vector3(length / 2, 0, 0)
  ]);
  const line = new THREE.Line(lineGeometry, mat);
  group.add(line);

  const tickStep = length / 20;
  for (let i = -length / 2; i <= length / 2; i += tickStep) {
    if (i !== 0) { // Avoid center
      group.add(createTick(i, mat));
    }
  }

  return group;
}

function createCrosshair() {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0x00FF00 });
  const dashMaterial = new THREE.LineDashedMaterial({ color: 0x00FF00, dashSize: 0.1, gapSize: 0.1 });

  // Main lines with ticks
  const lineLength = 4;
  const horizontalLine = createLineWithTicks(lineLength, mat);
  const verticalLine = createLineWithTicks(lineLength, mat);
  verticalLine.rotation.z = Math.PI / 2;

  group.add(horizontalLine);
  group.add(verticalLine);



  // L-shapes
  const lShapeSize = 0.5;
  const distanceFromCenter = 2; // Adjust as needed
  addLShapesToCorners(group, lShapeSize, mat, distanceFromCenter);

  group.scale.set(3,3,3); // Scaling the whole crosshair group
  return group;
}


// Create the Crosshair Mesh
const crosshair = createCrosshair();
crosshair.position.z = -5; // Adjust if needed to move the crosshair in front of the camera
scene.add(crosshair);


// Your existing animation and rendering code...


// Constants that define the nature of the trajectory
const amplitudeX = 5; // amplitude of the x-axis movement
const amplitudeY = 5; // amplitude of the y-axis movement
const amplitudeZ = 5; // amplitude of the z-axis movement
const frequencyX = 0.01; // frequency of the x-axis movement
const frequencyY = 0.01; // frequency of the y-axis movement
const frequencyZ = 0.01; // frequency of the z-axis movement
const phaseX = 0; // phase shift of the x-axis movement
const phaseY = Math.PI / 4; // phase shift of the y-axis movement
const phaseZ = Math.PI / 2; // phase shift of the z-axis movement

function animateCrosshair(time) {
  // Time is in milliseconds, so we convert it to seconds for easier handling
  const t = time * 0.1; // convert time to seconds for frequency scaling
  
  // Calculate a non-repeating path using sine and cosine
  // By using different frequencies for each axis, the movement pattern will be non-repeating
  const x = amplitudeX * Math.cos(frequencyX * t + phaseX);
  const y = amplitudeY * Math.sin(frequencyY * t + phaseY);
  const z = amplitudeZ * Math.sin(frequencyZ * t + phaseZ) + 12;
  const rotx = Math.cos(frequencyX * t * 1);
  const roty = Math.sin(frequencyY * t * 1);
  const rotz = Math.sin(frequencyZ * t * 1);
  // Update the crosshair's position
  crosshair.position.set(x, y, z);
  crosshair.rotation.set(rotx, roty, rotz);
}


// hexagon
function createHexagonShape(size) {
  let hexShape = new THREE.Shape();
  hexShape.moveTo(size * Math.cos(0), size * Math.sin(0));
  for (let i = 1; i <= 6; i++) {
    hexShape.lineTo(
      size * Math.cos((i * 2 * Math.PI) / 6),
      size * Math.sin((i * 2 * Math.PI) / 6)
    );
  }
  return hexShape;
}

// Hexagon geometry parameters
let hexSize = 0.4;
let hexHeight = Math.sqrt(3) * hexSize;
let hexThickness = 0.3;
let spacing = 0.1;  // Control the space between hexagons
let missingFrequency = 0.1;  // Approx 1 in 10 hexagons will be missing


let instanceCount = 3000;
let cols = Math.ceil(Math.sqrt(instanceCount)); // Calculate the number of columns needed

// Boundary parameters are now defined after hexagon positions have been adjusted to center
let boundaryRadius = cols * (hexSize + spacing) / 2;

// Create hexagon geometries
let hexShape = createHexagonShape(hexSize);
let extrudeSettings = { depth: hexThickness, bevelEnabled: false };
let hexGeometry = new THREE.ExtrudeGeometry(hexShape, extrudeSettings);

// Hexagon face mat (orange color)
let hexFaceMaterial = new THREE.MeshBasicMaterial({
  color: 0xffa500,
  transparent: true, // Enable transparency
  opacity: 1.0 // Full opacity initially
});

// Hexagon side mat (yellow color)
let hexSideMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true, // Enable transparency
  opacity: 1.0 // Full opacity initially
});

// Now we use an array of materials for the instanced mesh
let instancedHexMesh = new THREE.InstancedMesh(hexGeometry, [hexFaceMaterial, hexSideMaterial], instanceCount);


// Dummy transformation object
let hexDummy = new THREE.Object3D();

// Calculate offsets and create instanced hexagons
let colWidth = hexSize * 3/2 + spacing;  // Including spacing
let rowHeight = hexHeight + spacing;  // Including spacing

// Calculate the grid center offsets
let offsetX = ((cols - 1) * colWidth + (hexSize / 2)) / 2;
let offsetY = ((Math.ceil(instanceCount / cols) - 1) * rowHeight + (hexHeight / 2)) / 2;

for (let i = 0, l = instancedHexMesh.count; i < l; i++) {
  let col = i % cols;
  let row = Math.floor(i / cols);

  let x = col * colWidth - offsetX;
  let y = row * rowHeight - offsetY + (col % 2) * (rowHeight / 2);

  // Use distance from the center to create a boundary
  let distFromCenter = Math.sqrt(x * x + y * y);
  let shouldBeMissing = Math.random() < missingFrequency || distFromCenter > boundaryRadius;

  if (shouldBeMissing) {
    // Skip this hexagon by scaling it to zero
    hexDummy.scale.set(0, 0, 0);
  } else {
    hexDummy.position.set(x, y, 0);
    hexDummy.scale.set(1, 1, 1); // Reset scale for visible hexagons
  }
  hexDummy.updateMatrix();
  instancedHexMesh.setMatrixAt(i, hexDummy.matrix);
}

instancedHexMesh.instanceMatrix.needsUpdate = true;

// Now, instancedHexMesh is centered around the origin
// You can move it as needed by changing its position.
instancedHexMesh.position.set(0, 0, 0); // Center the hexagon grid at the scene's origin

scene.add(instancedHexMesh);

for (let i = 0; i < instancedMesh.count; i++) {
  let radius = Math.random() * 2 + 1; // Smaller radius for bee paths
  
  origins.push({
    x: randomFormulaOne(),
    y: randomFormulaOne(),
    z: randomFormulaOne()
  });

  phases.push({
    x: randomFormulaTwo(),
    y: randomFormulaTwo(),
    z: randomFormulaTwo(),
  });

  let speedModifier = i < instancedMesh.count / 2 ? Math.random() * 0.75 + 0.25 : 1;
  speedModifiers.push(speedModifier);

  beeParams.push({
    radius: radius,
    scaleModifier: Math.random() * 0.5 + 0.5,
    speed: baseSpeed * speedModifier / radius,
    sinCosMix: {
      changeTime: Math.random(),
      duration: Math.random() * 3000 + 1000, // Random duration from 1s to 4s
      sinMultiplier: Math.ceil(Math.random() * 5),
      cosMultiplier: Math.ceil(Math.random() * 5),
      lastChange: 0
    }
  });
}

function animateBee(index, time) {
  let origin = origins[index];
  let phase = phases[index];
  let params = beeParams[index];
  let sinCosMix = params.sinCosMix;
  let sinMultiplier = sinCosMix.sinMultiplier;
  let cosMultiplier = sinCosMix.cosMultiplier;

  // Change function mix based on time
  if (time - sinCosMix.lastChange > sinCosMix.duration * sinCosMix.changeTime) {
    sinCosMix.sinMultiplier = Math.ceil(Math.random() * 5);
    sinCosMix.cosMultiplier = Math.ceil(Math.random() * 5);
    sinCosMix.lastChange = time;
  }

  let scale = Math.sin(time * params.scaleModifier + phase.x) * 0.3 + 0.7;
  dummy.position.set(
    (Math.sin(time * params.speed + phase.x) * sinMultiplier +
     Math.cos(time * params.speed + phase.x) * cosMultiplier) * params.radius + origin.x,
    (Math.sin(time * params.speed + phase.y) * sinMultiplier +
     Math.cos(time * params.speed + phase.y) * cosMultiplier) * params.radius + origin.y,
    (Math.sin(time * params.speed + phase.z) * sinMultiplier +
     Math.cos(time * params.speed + phase.z) * cosMultiplier) * params.radius + origin.z
  );
  dummy.scale.set(scale, scale, scale);
  dummy.rotation.set(phase.x, phase.y, phase.z);
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(index, dummy.matrix);
}

let step = 0;
tvGroup.opacity = 0
hexFaceMaterial.opacity = 0;
hexSideMaterial.opacity = 0;
console.log(tvGroup)
tvGroup.scale.set(0, 0, 0)
crosshair.scale.set(0, 0, 0)

// Outside of your animate function
let currentScaleTvGroup = new THREE.Vector3(0, 0, 0); // Start scale
let currentScaleCrosshair = new THREE.Vector3(0, 0, 0); // Start scale

const targetScaleTvGroup = new THREE.Vector3(3, 3, 3);
const targetScaleCrosshair = new THREE.Vector3(1, 1, 1);
const scaleDuration = 20000; // Duration in milliseconds
let scaleStartTime = -1; // Initial time for the start of the scale

let targetOpacity = 1; // Target opacity
let opacityDuration = 20000; // Duration in milliseconds for opacity transition
let opacityStartTime = -1; // Initial time for the start of the opacity transition



mat.opacity = 0

//begin raycaster




const setupRain = () => {
  let oldCanvas = document.getElementById('canvas');
  oldCanvas.width = 0;
  oldCanvas.height = 0;
  let canvas = document.getElementById('canvasTwo');
  canvas.hidden = false;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  oldCanvas.hidden = true;

  let fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = [];

  const fadeChars = []; // Added to keep track of fading characters

  for (let i = 0; i < columns; i++) {
    drops[i] = -1;
  }

  function getRandomChar() {
    const charRanges = [
      [0x0020, 0x003F], // Basic Latin
      [0x16A0, 0x16EA], // Runic
      [0x4E00, 0x5A00], // CJK Unified Ideographs
      [0x16A0, 0x16EA], // Runic
      [0x16A0, 0x16EA], // Runic
      [0x16A0, 0x16EA], // Runic
      [0x16A0, 0x16EA], // Runic
      [0x30A0, 0x30FF], // Katakana
      [0x16A0, 0x16EA], // Runic
    ];

    let charCode;
    do {
      const rangeIndex = Math.floor(Math.random() * charRanges.length);
      const [start, end] = charRanges[rangeIndex];
      charCode = Math.floor(Math.random() * (end - start + 1)) + start;
    } while (
      (charCode >= 0xD800 && charCode <= 0xDFFF)
    );
    return String.fromCharCode(charCode);
  }

  const asciiArt = [
    "                               .;'.'o0KXNNNNNNWWWWWWWWWNNNNXXX0c....                                ",
    "                              .'..,oOKKXNNNWWWWWWWWWWWWNNNNXXXKOl'..                                ",
    "                             ....'lk0KXXNNNWWWWWWWWWWWNNNNNXXXK0Ol...                               ",
    "                             ....;ldO0KXNNNWWWWWWWWWWWWWWWNNXK00ko;....                             ",
    "            .                . ..;clxOKXXNNWWWWWWWWWWWWWWWNXXK0Odc;. ...           ....             ",
    "     ...........   .        .   .':cldOKXXNWWMMWWWWWWWWWWWNXKKOdc:,.  ..     ............           ",
    "   ...':llloddddoc::,..     .    .;codx0XXNNWWWWWMWWWWWWWNNXXKkdl:'    .   ...':oooddxxxolcc;..     ",
    "  .''lOXNNNWWWWWNNNX0o,.    .    .;cdxddk0KXXNNWWWWWWWWWNXXKOxdxdc'       .''cOXNNNWWWWWNNNXKd;.    ",
    " ...l0KXNNWWWWWWWNNXXKd,.        .'...   ..,:cldOO00Okdlc:,..  ....      ...cOKXNNWWWWWWNNNNXKx,.   ",
    " ..,lkKXNWWWWWWWWWNXK0x:..       ..            .;ldxo;.              .   ..'ok0XNWWWWWWWWWWNK0kc... ",
    "   ':okKXNWMWWWWWWNXKkl,. . ...  ...           'dOKNKd'             ...    .lxk0XNWWWWWWWWNXKko;. . ",
    "   .;coOXNWWWWWWWWNX0xl,   .,'.. .;;'..       .oKKXNXKo.        .....,,.   .:dkOKNNWWWWWWWNX0ko,    ",
    "   .....,:ldk00Oxoc;'...   .::,. .':olc:;;;;,,cOXNWWNKkl;;,,,;:cc;...;,    .','.,:cox00Oxoc;'',.    ",
    "            'dkc.        . .,lc'...';ldddddxxdokXNWWN0xoddooodol:'..cc.  .  .       .dOl.        .  ",
    "....'..    .lXNO,     ...'. .,cc,...';coodxkxl;,:lool;,cdxdoooc;...;l;  .'..''.     cKN0:     ...'. ",
    ",;..,clc:::cONWKdc:::c:..;.   .;;.....':odxkxd;.      'lxkxddl;...';'   ':..,llcc::ckNWXxc:::cc'.;. ",
    ".:;..':odxxc:dxlcddoo:'.;;     .,;....';odxk0Oxc'.. .:dO0Okxoc'....'.   .;:..;codxxl:odl:oxolc'.;;. ",
    " .''..':dxko.  .cxkdc'.''.     .c:....',lddxkkdo:;,,;cldxxxdl;...         ''.,:coxkd,  .cxkdc,..'.  ",
    "  .,...;odxdc'.:oxxo;...       .:;. ...':lc;;;;;;;::;;;;;;::;'..          .;..;:ldxdc'':oxdl:'..    ",
    "  .;. .';:clllllllc:'.         .cl'  ...',;coooolllllodddl;,'..           .:...,;:cccclccc:;'.      ",
    "  .;'  ..,c;,,,,:c;..           ;o;   ....';:,.........,:;'...            .:,  ..,::,,;,;:;..       ",
    "   ',.  ..';lddo:'..            .l:.    ....',:oxxxkkdc;'....              ;:.  ..':oxxdc'..        ",
    "   .;...  ..',,,'.. .            ;l'..     .';codddxxdl:'.    .            .:...  .',;;,'.  ..      ",
    "   .:'......     ......          'o:.....   .............  ....            .:,......     ......     ",
    "  ..;;,'...........';:'.         ,ol,...''.................';:,..         ..;:;'...........';:,..   ",
    "                                   ",
    "! EPILEPSY WARNING !",
    "                                   ",
    "FLASHING LIGHTS IMMINENT",
  ];

  const messages = [
[
"                     .......''... ...                                                               ",
"                  ....'..'......................                                                    ",
"                ...',,;;;,.......'..............                                                    ",
"              ''.',,',,'.......',','.',,;;;;,'.........   .                                         ",
"             '.'''.....  .. ...',::::ccclool::;,'.............                                      ",
"            '.''..         ....;looddlldxkxolc:;,'''..'...'....   .........                         ",
"           '.''.           ...;dddxkxodxxxxdolc:;,,,,;,'..''................                        ",
"          ,.''.          ...'cxOxxkkkxkkxxxxdolcccc:cc:,,,;:,'...............                       ",
"          ....           ..;oxOOOOOOOOOkkkkkxdddddooollclcc:;;;,,'...........                       ",
"          ..             .,lxkOO0OOOOOOOOOOkxkkkxdoddoooolcccccc;,,'.........                       ",
"                .       .'codxkkOOOOOOOOOOOOkkkkxxdddodolclolcc;,''..........                       ",
"              .'.      .,:loodxkkkkkkkkkkkkkkkkxdddooooollllc::,'............                       ",
"              ',.     .;lloddddxkkkkkkxxddddxxdooooooddolllc:;;'..............                      ",
"             .'.      .ldooddxxxkkxolc::;;;;;:ccclllooolcc:;,;;..           ...                     ",
"            ....      .looodddxdc:;'........  ..',:c:::;,'...'.                ..                   ",
"            ...       .cddodkd:,,,..             ..,;;;,'....                  ...                  ",
"             .        .;loloxc....                .:ool:,..                                         ",
"            .          'clooo;....                .lOOkdl,.                                         ",
"           ...        .;loooo;...                 ,x0Okdl;..                   ..                   ",
"           ...        .cdddddl;,,'....          ..lOOOOxo:...                ....                   ",
"          .''.   ..  ..:dxxxxxocllc;,..     ....,ckOOOOxo:....             ..''..                   ",
"          .'..   ......:dxxdxxxdloddo:'....'';c:lkOOOOOkd:'......................                   ",
"          .....  ......'lddxxxxkkkxdl;;;;;;;;:::dkOOOOOkoc'...........''.........                   ",
"          .....  ..... .,ldxxkkOOO0Odc:;;,,,'.:xkkkkOOOOdc,.........,,'''''......                   ",
"          .....   .......:dxxkkxkOOkkxlc;'....oOkkkkOOOkdc,......  .';;,''.......                   ",
"          ,....  ....'..':dxxkxxkxxxdoc;'....:ddlcclodol:,....... . ..,,,'.......                   ",
"           ...  ...',,,'':dxxkkxdddoc:'...':okkxc'..',,'...      ... ............                   ",
"                 .';:loc;cdxxxxdoolc;,,;;;cdxxxddl;'.....         .   ............                  ",
"                  .:oxxd:cdxkxxdool::llc;;:loodddoc:,.......   ...     ..........                   ",
"                   ..'''';okkkxddolcloc;,';clllcc:;,,,,,,;'..   ....   ..........                   ",
"                       ..'lkkkxxxdoooo:'............'''.....           ..........                   ",
"                       ...;dkxxxdddddo:..   ..:oclooxkxl:ll,....       .........                    ",
"          .      ..........cdxxdddddooc,':l:;;ldddooddoc:c:,.....  ............                     ",
"          ;.   .','''.......:odddoooool:lxOkxooddooddddlcc;,,,,...............                      ",
"          ;'..,;;,,,'. ......,loooooollodkOOkxddddolllcccc:;,................                       ",
"          .. .;;;,,,,.  .......:oooooooodxkkkxxdoolc::;,,'..................                        ",
"          .. .';;,,,,.. ........,loodddodxxxxxxdolc:;,,'...................                         ",
"          ..  .;;,,,,'. ..........:odddddxxxxxxddlc:;;,'..................                          ",
"          ..  .,;,,,,,.. ..........':llodxkkkkkxxdoolccc:;,''............                           ",
"          .....,;;,,,,'.  ............;cldxkkkkkkkkxddoolcc::;;,,,....                              ",
"             ..';;;,,'''.  .............,:ldxxkkkkkxdooccccc:;,,'....             .....             ",
"              .',;;,,,'''.  ..............';clllooollc:;,,;;;,.....              .''''              ",
"              .',;;,,,,,,.   .......       ..',,,;;;;;,'.........              ..'''                ",
"               .',;;,,,,,,.    ....           ...............                ..'''                  ",
    ],
    [
      "BARTŁOMIEJ JODŁOWSKI",
      "  ",
      "Software Developer",
      "  ",
      "  ",
      "ponctan@gmail.com",
      "  ",
      "linkedin.com/in/momimomo/"
    ],
    // []
  ];

  let messageDisplayDuration = 100; // Number of frames for each message to be displayed
  let messageDisplayFrequency = 20; // Number of frames between each message display

  let currentMessageIndex = 0;
  let messageDisplayCounter = 0;

  
  function drawMessage(opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#00ff00';
    ctx.font = `${fontSize}px monospace`;
    const currentMessage = messages[currentMessageIndex];
    const yOffset = (canvas.height / 2) - fontSize * (currentMessage.length / 2);
    for (let i = 0; i < currentMessage.length; i++) {
      const textWidth = ctx.measureText(currentMessage[i]).width;
      const xOffset = (canvas.width - textWidth) / 2;
      ctx.fillText(currentMessage[i], xOffset, yOffset + i * fontSize);
    }
    ctx.restore();
  }

  let asciiArtDisplayTime = 0;
  const maxAsciiArtDisplayTime = 40;

  function drawAsciiArt() {
    ctx.fillStyle = '#00ff00';
    ctx.font = `${fontSize}px monospace`;
    const yOffset = (canvas.height / 2) - fontSize * (asciiArt.length / 2);
    for (let i = 0; i < asciiArt.length; i++) {
      const textWidth = ctx.measureText(asciiArt[i]).width;
      const xOffset = (canvas.width - textWidth) / 2;
      ctx.fillText(asciiArt[i], xOffset, yOffset + i * fontSize);
    }
  }


  let transitionProgress = 0;
  const transitionDuration = 16000; 

  function updateProgress() {
    transitionProgress += 50;
    if (transitionProgress > transitionDuration) {
      transitionProgress = transitionDuration;
    }
  }


  function drawAsciiArt() {
    ctx.fillStyle = '#00ff00';
    ctx.font = `${fontSize}px monospace`;
    const yOffset = (canvas.height / 2) - fontSize * (asciiArt.length / 2);
    for (let i = 0; i < asciiArt.length; i++) {
      const textWidth = ctx.measureText(asciiArt[i]).width;
      const xOffset = (canvas.width - textWidth) / 2;
      ctx.fillText(asciiArt[i], xOffset, yOffset + i * fontSize);
    }
  }

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
  function drawMatrixRain() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px monospace`;
    for (let i = 0; i < drops.length; i++) {
      const char = getRandomChar();

      const progress = smoothstep(0, 1, transitionProgress / transitionDuration);
      const angle = (i / drops.length) * 2 * Math.PI + progress * 2 * Math.PI;
      const radiusFactor = progress * 0.5;
      const maxRadius = Math.max(canvas.width, canvas.height) / 2;
      const radius = fontSize * drops[i] * (1 - radiusFactor) + maxRadius * radiusFactor;
      const x = (1 - progress) * (i * fontSize) + progress * (canvas.width / 2 + Math.cos(angle) * radius);
      const y = (1 - progress) * (drops[i] * fontSize) + progress * (canvas.height / 2 + Math.sin(angle) * radius);

      ctx.fillStyle = '#00ff00';
      ctx.fillText(char, x, y);

      if (Math.random() < 0.01 || drops[i] * fontSize > canvas.height * 2) {
        drops[i] = 0;
      }

      // Fading character logic
      if (Math.random() < 0.0025) { // Adjust probability to control how often characters fade
        fadeChars.push({
          char: char,
          x: x,
          y: y,
          opacity: 1,
          fadeSpeed: Math.random() * 0.01 + 0.005, // Adjust fade speed
          glitchSpeed: Math.random() * 0.15 + 0.01 // Added glitch speed
        });
      }

      drops[i]++;
    }

// Draw fading characters
for (let i = fadeChars.length - 1; i >= 0; i--) {
      ctx.fillStyle = `rgba(0, 255, 0, ${fadeChars[i].opacity})`;
      ctx.fillText(fadeChars[i].char, fadeChars[i].x, fadeChars[i].y);
      fadeChars[i].opacity -= fadeChars[i].fadeSpeed;

      // Glitch effect: change character randomly
      if (Math.random() < fadeChars[i].glitchSpeed) { // Adjust glitch probability
        fadeChars[i].char = getRandomChar();
      }

      if (fadeChars[i].opacity <= 0) {
        fadeChars.splice(i, 1);
      }
    }
  }
  function draw() {
    if (asciiArtDisplayTime < maxAsciiArtDisplayTime) {
      drawAsciiArt();
      asciiArtDisplayTime++;

      const yOffset = Math.floor((canvas.height / 2) - fontSize * (asciiArt.length / 2));
      for (let i = 0; i < asciiArt.length; i++) {
        const textWidth = ctx.measureText(asciiArt[i]).width;
        const xOffset = Math.floor((canvas.width - textWidth) / 2 / fontSize);
        for (let j = 0; j < asciiArt[i].length; j++) {
          if (Math.random() < 0.001 * (1 + asciiArtDisplayTime / maxAsciiArtDisplayTime)) {
            const x = xOffset + j;
            if (drops[x] === -1) {
              drops[x] = yOffset / fontSize + i;
            }
          }
        }
      }
    } else if (transitionProgress < transitionDuration) {
      drawMatrixRain();
      updateProgress();
    } else {
      drawMatrixRain();
      if (messageDisplayCounter < messageDisplayDuration) {
        const opacity = Math.min(1, messageDisplayCounter / 10);
        drawMessage(opacity);
      } else if (messageDisplayCounter < messageDisplayDuration + messageDisplayFrequency) {
        // Do nothing
      } else {
        messageDisplayCounter = 0;
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;
      }
      messageDisplayCounter++;
    }
  }

  setInterval(draw, 50);
}



// Create a raycaster for later use
const raycaster = new THREE.Raycaster();
// Store the mouse position
const mouse = new THREE.Vector2();
// Used for touch screens
const touch = new THREE.Vector2();

function onClick(event) {
  // Calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  checkIntersection(mouse);
}

function onTouch(event) {
  // Assume single touch point for simplicity
  if (event.touches.length > 0) {
    const touchEvent = event.touches[0];
    touch.x = (touchEvent.clientX / window.innerWidth) * 2 - 1;
    touch.y = -(touchEvent.clientY / window.innerHeight) * 2 + 1;

    checkIntersection(touch);
  }
}

function checkIntersection(coords) {
  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(coords, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObject(tvGroup);
  console.log(raycaster)

  if (intersects.length > 0) {
    // Assuming 'box' is your mesh and it's the first intersected object
    // Trigger your function here
    yourFunction(intersects[0]);
  }
}

function yourFunction(intersection) {
  // Do something with the intersection object, e.g., change color, show details, etc.
  mainAnimStop = true;
  renderer.clear()
  setupRain();
  console.log('Box was clicked', intersection);
}

// Bind the event listeners for mouse and touch events
renderer.domElement.addEventListener('click', onClick, false);
renderer.domElement.addEventListener('touchstart', onTouch, false);




// Render Loop Start
function animate() {
  if (mainAnimStop) return null;
  requestAnimationFrame(animate);
  let time = Date.now();
  const elapsedTime = clock.getElapsedTime();
  if (elapsedTime < 10) {
    updateParticles();
  }

  if (elapsedTime > 6 && step === 0) {
    scaleStartTime = elapsedTime; // Set the start time for scaling
    opacityStartTime = elapsedTime; // Set the start time for opacity transition
    explosionMaterial.opacity = 0
    scene.remove(exDummy.name)
    step = 1;
  }

  
 // Smooth scale logic
 if (scaleStartTime !== -1) {
  let timeSinceStart = elapsedTime - scaleStartTime;
  if (timeSinceStart < scaleDuration / 1000) {
    let scaleProgress = timeSinceStart / (scaleDuration / 1000);
    tvGroup.scale.lerpVectors(currentScaleTvGroup, targetScaleTvGroup, scaleProgress);
    crosshair.scale.lerpVectors(currentScaleCrosshair, targetScaleCrosshair, scaleProgress);
  } else {
    // Ensure final scale is set
    tvGroup.scale.copy(targetScaleTvGroup);
    crosshair.scale.copy(targetScaleCrosshair);
    scaleStartTime = -1; // Reset scale start time
  }
}

  // Smooth opacity logic
  if (opacityStartTime !== -1) {
    let timeSinceStart = elapsedTime - opacityStartTime;
    if (timeSinceStart < opacityDuration / 1000) {
      let opacityProgress = timeSinceStart / (opacityDuration / 1000);
      hexFaceMaterial.opacity = opacityProgress * targetOpacity;
      hexSideMaterial.opacity = opacityProgress * targetOpacity;
      mat.opacity = opacityProgress * targetOpacity;
    } else {
      hexFaceMaterial.opacity = targetOpacity;
      hexSideMaterial.opacity = targetOpacity;
      mat.opacity = targetOpacity;
      opacityStartTime = -1; // Reset opacity start time
    }
  }


  if (elapsedTime > 6) {
    for (let i = 0; i < instancedMesh.count; i++) {
        animateBee(i, time);
        updateWave(time * 0.001);
        animateCrosshair(time);
      }
    }
  instancedMesh.instanceMatrix.needsUpdate = true;

  controls.autoRotateSpeed = 1200 * clock.getDelta();
  composer.render();
  controls.update();
}

instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(instancedMesh);

camera.position.z = 50;
animate();
