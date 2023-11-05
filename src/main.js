
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Smaller bees
let material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
let instancedMesh = new THREE.InstancedMesh(geometry, material, 160);

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
controls.target.set(5, 5, 5);


// TV

// Create a group for the entire TV
const tvGroup = new THREE.Group();


// Materials
const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x88dd88 });
const screenMaterial = new THREE.MeshPhongMaterial({ color: 0x444411, shininess: 100, specular: 0x222222 });
const crtScreenMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100, specular: 0x222222 });
const buttonMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });
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
scene.add(tvGroup);



// hexagon

// Function to create a hexagon shape
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
let hexSize = 1;
let hexHeight = Math.sqrt(3) * hexSize;
let hexThickness = 0.5;
let spacing = 0.5;  // Control the space between hexagons
let missingFrequency = 0.1;  // Approx 1 in 10 hexagons will be missing


let instanceCount = 800;
let cols = Math.ceil(Math.sqrt(instanceCount)); // Calculate the number of columns needed

// Boundary parameters are now defined after hexagon positions have been adjusted to center
let boundaryRadius = cols * (hexSize + spacing) / 2;

// Create hexagon geometries
let hexShape = createHexagonShape(hexSize);
let extrudeSettings = { depth: hexThickness, bevelEnabled: false };
let hexGeometry = new THREE.ExtrudeGeometry(hexShape, extrudeSettings);

// Hexagon face material (orange color)
let hexFaceMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });

// Hexagon side material (yellow color)
let hexSideMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

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

function animate() {
  requestAnimationFrame(animate);
  let time = Date.now();
  for (let i = 0; i < instancedMesh.count; i++) {
    animateBee(i, time);
  }
  updateWave(time * 0.001);
  instancedMesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
  controls.update();
}

instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(instancedMesh);
camera.position.z = 50;
animate();
