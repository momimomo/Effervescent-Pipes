
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { 
  getRandomInt,
  randomHexColor,
  getRandomValueFromArray,
  rotate,
  getAllRotations,
  createGrid,
  createAll,
  getAllShapesVariants,
  reduceAllowedNeighbors,
  findLowestEntropyCell,

} from './utils'

let scene = new THREE.Scene();
let clock = new THREE.Clock();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
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


const particleCount = 10000;
const boxGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const explosionMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true, // Enable transparency
  opacity: 1.0 // Full opacity initially
});
const particles = new THREE.InstancedMesh(boxGeometry, explosionMaterial, particleCount);
scene.add(particles);

let maxDiameter = 100; // maximum radius of explosion
let timeToMax = 2; // time in seconds to reach maxDiameter
let cooldownTime = 5; // time in seconds to cool down to the average level






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

  // Opacity update during cooldown phase to fade out before it ends
  if (isInCooldownPhase) {
    let adjustedOpacityProgress = Math.min(1, elapsedTime / (timeToMax + cooldownTime - 2)); // End fade out 3/4 through cooldown
    explosionMaterial.opacity = 1 - adjustedOpacityProgress; // Fade out from full opacity to 0
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
let hexSize = 0.5;
let hexHeight = Math.sqrt(3) * hexSize;
let hexThickness = 0.5;
let spacing = 0.2;  // Control the space between hexagons
let missingFrequency = 0.1;  // Approx 1 in 10 hexagons will be missing


let instanceCount = 1600;
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



// wfc



// This should create every shape once, and reuse them using InstancedMesh or similar
async function delayedLoop() {
  
const unique3DShapes = [
  "110000",
  "010100",
  "111000",
  "111001",
  "111100",
  "111110",
  "111111",
  "000000"
];


const cellSize = 0.33333333;
const wfcboxgeom = new THREE.BoxGeometry(cellSize, cellSize, cellSize);

function createThreeJSShape(shape) {
const color = new THREE.Color(randomHexColor(["16", "0F", "28", "0F", "25", "0F"]));

const material = new THREE.MeshToonMaterial({ color });

const countOfOnes = shape.split("").filter(i => i === "1").length;
  // count of needed cubes is equal to central one + all 1s in shape
  const cubes = new THREE.InstancedMesh(wfcboxgeom, material, 1 + countOfOnes);

  const shapeObject = new THREE.Object3D();
  
  if (shape === "000000") {
    return shapeObject;
  }

  let matrixIdx = 0

// initial one
cubes.setMatrixAt(matrixIdx, new THREE.Matrix4().setPosition(0, 0, 0));

for (let i = 0; i < 6; i++) {
  if (shape[i] === "1") {
    const x = (i === 0 || i === 1) ? cellSize * (i * 2 - 1) : 0;
    const y = (i === 2 || i === 3) ? cellSize * (i * 2 - 5) : 0;
    const z = (i === 4 || i === 5) ? cellSize * (i * 2 - 9) : 0;
    matrixIdx ++
    
    cubes.setMatrixAt(matrixIdx, new THREE.Matrix4().setPosition(x, y, z));
  }
}
cubes.instanceMatrix.needsUpdate = true
shapeObject.add(cubes);
return shapeObject;
}



const allShapesVariants = getAllShapesVariants(unique3DShapes);

let grid = createGrid(9, allShapesVariants);

grid[4][4][4] = {shape: '111111', allowed: []}
reduceAllowedNeighbors([4,4,4], grid)


for (let i=0;i<1024;i++) {
const lowestEntropyCell = findLowestEntropyCell(grid)
if (lowestEntropyCell) {
  const [x,y,z] = lowestEntropyCell;
  grid[x][y][z] = {
    shape: getRandomValueFromArray(grid[x][y][z]['allowed']),
    allowed: []
  }
  reduceAllowedNeighbors([x,y,z], grid)
}

}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid.length; y++) {
      for (let z = 0; z < grid.length; z++) {
        const t = grid[x][y][z].shape;
        if (t) {
          const obj = createThreeJSShape(t);
          scene.add(obj);
          obj.position.set(x, y, z);
        }
        await sleep(1);
      }
    }
  }


}

mat.opacity = 0

function animate() {
  requestAnimationFrame(animate);
  let time = Date.now();
  const elapsedTime = clock.getElapsedTime();
  if (elapsedTime < 10) {
    updateParticles();
  }

  if (elapsedTime > 10 && step === 0) {
    scaleStartTime = elapsedTime; // Set the start time for scaling
    opacityStartTime = elapsedTime; // Set the start time for opacity transition
    explosionMaterial.opacity = 0
    scene.remove(exDummy.name)
    step = 1;
  }

  // Maybe remove WFC completely?
  // if (elapsedTime > 30 && step === 1) {
  //   scene.remove(instancedHexMesh.name)
  //   console.log(scene)

  //   scene.remove.apply(scene, scene.children);

    
  //   console.log('step', step)
  //   step = 2
  //   scene.add(ambientLight);

  //   delayedLoop();
  //   console.log(scene)
  // }

  // zdecydowanie klikniecie na tyl powinno wywolywac animacje z mojego aktualnego home

  
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
  renderer.render(scene, camera);
  controls.update();
}

instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(instancedMesh);

camera.position.z = 50;
animate();
