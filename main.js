import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { 
  getRandomInt,
  randomHexColor,
  getRandomValueFromArray,
  rotate,
  getAllRotations 
} from './utils'


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
const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);

function createThreeJSShape(shape) {
  const color = new THREE.Color(randomHexColor(["04", "01", "3B", "0F", "59", "0F"]));

  const material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });

  const createCube = (x, y, z) => {
    const cube = new THREE.InstancedMesh(geometry, material, 1);
    cube.setMatrixAt(0, new THREE.Matrix4().setPosition(x, y, z));
    return cube;
  };

  const shapeObject = new THREE.Object3D();

  if (shape === "000000") {
    return shapeObject;
  }

  shapeObject.add(createCube(0, 0, 0));

  for (let i = 0; i < 6; i++) {
    if (shape[i] === "1") {
      const x = (i === 0 || i === 1) ? cellSize * (i * 2 - 1) : 0;
      const y = (i === 2 || i === 3) ? cellSize * (i * 2 - 5) : 0;
      const z = (i === 4 || i === 5) ? cellSize * (i * 2 - 9) : 0;

      shapeObject.add(createCube(x, y, z));
    }
  }
  return shapeObject;
}


const getAllShapesVariants = (shapes) => {
  let allShapesVariants = []
  for (let shape of shapes) {
    const shapeVariants = getAllRotations(shape);
    allShapesVariants = [...allShapesVariants, ...shapeVariants]
  }
  return allShapesVariants;
}

function getCompatibleNeighbors(shape, direction, allShapes) {
  const compatibleNeighbors = [];

  allShapes.forEach((neighborShape) => {
    if (shape === neighborShape) return;

    let matchingFace;
    switch (direction) {
      case '-X':
        matchingFace = 1;
        break;
      case '+X':
        matchingFace = 0;
        break;
      case '-Y':
        matchingFace = 3;
        break;
      case '+Y':
        matchingFace = 2;
        break;
      case '-Z':
        matchingFace = 5;
        break;
      case '+Z':
        matchingFace = 4;
        break;
      default:
        throw new Error('Invalid direction');
    }

    if (shape[matchingFace] === neighborShape[matchingFace]) {
      compatibleNeighbors.push(neighborShape);
    }
  });

  return compatibleNeighbors;
}

function createGrid(n, allowedShapes) {
  const array = new Array(n);

  for (let x = 0; x < n; x++) {
    array[x] = new Array(n);

    for (let y = 0; y < n; y++) {
      array[x][y] = new Array(n);

      for (let z = 0; z < n; z++) {
        array[x][y][z] = { allowed: allowedShapes };
      }
    }
  }

  return array;
}

// only if a cell has a shape already
const reduceAllowedNeighbors = (position, grid) => {
  const [x, y, z] = position;
  const currentCell = grid[x][y][z];
  const shape = currentCell.shape;
  let neighborCell = {};
  let newAllowed = {}
  for (let i = 0; i < 6; i++) {
    switch (i) {
      case 0:
        neighborCell = grid[x - 1] && grid[x - 1][y] && grid[x - 1][y][z];
        if (neighborCell) {
          newAllowed = neighborCell.allowed.filter(i => shape[0] === i[1]);
          grid[x - 1][y][z]['allowed'] = newAllowed;
        }
        break;
      case 1:
        neighborCell = grid[x + 1] && grid[x + 1][y] && grid[x + 1][y][z];
        if (neighborCell) {
        newAllowed = neighborCell.allowed.filter(i => shape[1] === i[0]);
        grid[x + 1][y][z]['allowed'] = newAllowed;
        }
        break;
      case 2:
        neighborCell = grid[x] && grid[x][y - 1] && grid[x][y - 1][z];
        if (neighborCell) {
        newAllowed = neighborCell.allowed.filter(i => shape[2] === i[3]);
        grid[x][y - 1][z]['allowed'] = newAllowed;
        }
        break;
      case 3:
        neighborCell = grid[x] && grid[x][y + 1] && grid[x][y + 1][z];
        if (neighborCell) {
        newAllowed = neighborCell.allowed.filter(i => shape[3] === i[2]);
        grid[x][y + 1][z]['allowed'] = newAllowed;
        }
        break;
      case 4:
        neighborCell = grid[x] && grid[x][y] && grid[x][y][z - 1];
        if (neighborCell) {
        newAllowed = neighborCell.allowed.filter(i => shape[4] === i[5]);
        grid[x][y][z - 1]['allowed'] = newAllowed;
        }
        break;
      case 5:
        neighborCell = grid[x] && grid[x][y] && grid[x][y][z + 1];
        if (neighborCell) {
        newAllowed = neighborCell.allowed.filter(i => shape[5] === i[4]);
        grid[x][y][z + 1]['allowed'] = newAllowed;
        }
        break;
    }
  }
}

const findLowestEntropyCell = (grid) => {
  let lowestEntropy = 31; // 1 larger than number of all possible unique shapes (31 unique rotations of initial 7)
  let lowestEntropyCell;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid.length; y++) {
      for (let z = 0; z < grid.length; z++) {
        const target = grid[x][y][z];
        const isCollapsed = target.shape;
        if (!isCollapsed) {
          const numberOfShapes = target.allowed.length
          if (numberOfShapes < lowestEntropy) {
            lowestEntropy = numberOfShapes;
            lowestEntropyCell = [x,y,z];
          } 
        }
      }
    }
  }
  if (!lowestEntropyCell) {
    return false
  }
  return lowestEntropyCell;
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

function createScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(5, 5, 5);
  controls.autoRotate = true
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.x = 10;
  camera.position.y = 5;
  camera.position.z = 13;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  // This should create every shape once, and reuse them using InstancedMesh or similar
  async function delayedLoop() {
    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid.length; y++) {
        for (let z = 0; z < grid.length; z++) {
          const t = grid[x][y][z].shape;
          if (t) {
            const obj = createThreeJSShape(t);
            scene.add(obj);
            obj.position.set(x, y, z);
          }
          await sleep(50);
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
  delayedLoop()
}

createScene();
