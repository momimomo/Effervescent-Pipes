import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

function generateNeighbors(x, y, z) {
  const neighbors = [];
  for (let i = -1; i <= 1; i++) {
  for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
      if ((i === 0 && j === 0) || (i === 0 && k === 0) || (j === 0 && k === 0)) {
          neighbors.push([x + i, y + j, z + k]);
      }
      }
  }
  }
  return neighbors;
}

function createStructure(cells) {
  const structure = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => 0))
  );

  for (const [x, y, z] of cells) {
    structure[x][y][z] = 1;
  }

  return structure;
}


function isValid(cell) {
  const [x, y, z] = cell;
  return x >= 0 && x < 3 && y >= 0 && y < 3 && z >= 0 && z < 3;
}


function isConnected(structure) {
  const faceCenters = [
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
  [1, 1, 2],
  [1, 2, 1],
  [2, 1, 1],
  ];

  const connectedCenters = faceCenters.filter(([x, y, z]) => structure[x][y][z] === 1);

  if (connectedCenters.length < 2) {
  return false;
  }

  return true;
}



function generateCombinations() {
  const coreCell = [1, 1, 1];
  const neighbors = generateNeighbors(...coreCell).filter(isValid);
  const combinations = [];

  for (let i = 0; i < 2 ** neighbors.length; i++) {
  const selectedCells = neighbors.filter((_, index) => (i >> index) & 1);
  const structure = createStructure([coreCell, ...selectedCells]);

  if (isConnected(structure)) {
      combinations.push(structure);
  }
  }

  return combinations;
}

const combinations = generateCombinations();

function createScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  controls = new OrbitControls (camera, renderer.domElement);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.z = 8;
  let ix = 0

  for (let singleShape of combinations) {
    const cellMesh = generateCellMesh(singleShape);
  }

  
  for (let z = 0; z < 32; z += 2) {
    for (let y = 0; y < 32; y += 2) {
      for (let x = 0; x < 32; x += 2) {
        if (ix < combinations.length) {
          const cellMesh = generateCellMesh(combinations[ix]);
          scene.add(cellMesh);
          cellMesh.position.set(x, y, z)
          ix += 1
        }
      }
    }
  }



  function animate() {
    controls.update();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}

function generateCellMesh(cellData) {
  const material = new THREE.MeshBasicMaterial({ color: 0x888844, wireframe: false });
  const segmentSize = 1 / 3;

  let geometries = [];

  for (let z = 0; z < 3; z++) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (cellData[z][y][x] === 1) {
          const geometry = new THREE.BoxGeometry(segmentSize, segmentSize, segmentSize);
          geometry.translate(
            (x - 1) * segmentSize + segmentSize / 2,
            (y - 1) * segmentSize + segmentSize / 2,
            (z - 1) * segmentSize + segmentSize / 2,
          );
          geometries.push(geometry);
        }
      }
    }
  }

  const mergedGeometry = mergeBufferGeometries(geometries);
  const mesh = new THREE.Mesh(mergedGeometry, material);

  return mesh;
}


createScene();