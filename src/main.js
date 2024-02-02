import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
  const color = new THREE.Color(randomHexColor(["16", "0F", "28", "0F", "25", "0F"]));

  const material = new THREE.MeshToonMaterial({ color });

  const countOfOnes = shape.split("").filter(i => i === "1").length;
    // count of needed cubes is equal to central one + all 1s in shape
    const cubes = new THREE.InstancedMesh(geometry, material, 1 + countOfOnes);

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

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.2 );
  scene.add( directionalLight );


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
          await sleep(5);
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
