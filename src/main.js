function createFace(pointsArray, color, delay) {
  const ns = "http://www.w3.org/2000/svg";
  const polygon = document.createElementNS(ns, 'polygon');
  polygon.setAttributeNS(null, 'points', pointsArray.join(' '));
  polygon.setAttributeNS(null, 'fill', color);
  polygon.classList.add('face');
  polygon.style.animationDelay = `${delay}s`;
  return polygon;
}

function generateHexColors(config) {
  const keys = Object.keys(config);
  if (keys.length !== 6) {
    return Array.from({ length: 6 }, randomHexColor);
  }

  return keys.map(key => colorWithinRange(config[key], 44));
}

function randomHexColor() {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return '#' + randomColor.padStart(6, '0');
}

function colorWithinRange(hex, range) {
  let [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));

  r = clampColor(r + randomRange(-range, range));
  g = clampColor(g + randomRange(-range, range));
  b = clampColor(b + randomRange(-range, range));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampColor(value) {
  return Math.max(0, Math.min(value, 255));
}

const config = {
  color1: '000000',
  color2: 'DD00BB',
  color3: 'BB22FF',
  color4: '0022FF',
  color5: '00FF00',
  color6: 'FF2200'
};

const colors = generateHexColors(config);

const pointCoord1 = '779.58,400';
const pointCoord2 = '668.4,668.4';
const pointCoord3 = '511.18,511.18';
const pointCoord4 = '400,779.58';
const pointCoord5 = '511.18,288.82';
const pointCoord6 = '400,557.23';
const pointCoord7 = '242.77,400';
const pointCoord8 = '131.59,668.4';
const pointCoord9 = '668.4,131.59';
const pointCoord10 = '557.23,400';
const pointCoord11 = '400,242.77';
const pointCoord12 = '288.82,511.18';
const pointCoord13 = '400,20.42';
const pointCoord14 = '288.82,288.82';
const pointCoord15 = '131.59,131.59';
const pointCoord16 = '20.42,400';

const faces = [
  { points: [pointCoord1, pointCoord2, pointCoord4, pointCoord3], color: colors[0] },
  { points: [pointCoord5, pointCoord6, pointCoord8, pointCoord7], color: colors[0] },
  { points: [pointCoord9, pointCoord10, pointCoord12, pointCoord11], color: colors[0] },
  { points: [pointCoord13, pointCoord14, pointCoord16, pointCoord15], color: colors[0] },

  { points: [pointCoord2, pointCoord4, pointCoord8, pointCoord6], color: colors[1] },
  { points: [pointCoord10, pointCoord12, pointCoord16, pointCoord14], color: colors[1] },
  { points: [pointCoord1, pointCoord3, pointCoord7, pointCoord5], color: colors[1] },
  { points: [pointCoord9, pointCoord11, pointCoord15, pointCoord13], color: colors[1] },

  { points: [pointCoord2, pointCoord6, pointCoord14, pointCoord10], color: colors[2] },
  { points: [pointCoord4, pointCoord8, pointCoord16, pointCoord12], color: colors[2] },
  { points: [pointCoord3, pointCoord7, pointCoord15, pointCoord11], color: colors[2] },
  { points: [pointCoord1, pointCoord5, pointCoord13, pointCoord9], color: colors[2] },

  { points: [pointCoord10, pointCoord2, pointCoord4, pointCoord12], color: colors[3] },
  { points: [pointCoord14, pointCoord6, pointCoord8, pointCoord16], color: colors[3] },
  { points: [pointCoord9, pointCoord1, pointCoord3, pointCoord11], color: colors[3] },
  { points: [pointCoord13, pointCoord5, pointCoord7, pointCoord15], color: colors[3] },

  { points: [pointCoord3, pointCoord4, pointCoord12, pointCoord11], color: colors[4] },
  { points: [pointCoord7, pointCoord8, pointCoord16, pointCoord15], color: colors[4] },
  { points: [pointCoord1, pointCoord2, pointCoord10, pointCoord9], color: colors[4] },
  { points: [pointCoord5, pointCoord6, pointCoord14, pointCoord13], color: colors[4] },

  { points: [pointCoord3, pointCoord4, pointCoord8, pointCoord7], color: colors[5] },
  { points: [pointCoord1, pointCoord2, pointCoord6, pointCoord5], color: colors[5] },
  { points: [pointCoord9, pointCoord10, pointCoord14, pointCoord13], color: colors[5] },
  { points: [pointCoord11, pointCoord12, pointCoord16, pointCoord15], color: colors[5] },
];

const uniquePoints = new Set();
const svgContainer = document.querySelector('#svgContainer');
// svgContainer.innerHTML = svgDef;
const lines = document.querySelectorAll('line');
const angleGroups = {};
let lineDelay = 1;
let lineDelayIncrement = 1;
let faceDelay = 2;
let faceDelayIncrement = 1;
const angleTolerance = 0.5;

function getRoundedAngle(angle, tolerance) {
  return Math.round(angle / tolerance) * tolerance;
}

lines.forEach(line => {
  const x1 = parseFloat(line.getAttribute('x1'));
  const y1 = parseFloat(line.getAttribute('y1'));
  const x2 = parseFloat(line.getAttribute('x2'));
  const y2 = parseFloat(line.getAttribute('y2'));

  uniquePoints.add(`${x1},${y1}`);
  uniquePoints.add(`${x2},${y2}`);

  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

  const roundedAngle = getRoundedAngle(angle, angleTolerance); 

  if (!angleGroups[roundedAngle]) {
    angleGroups[roundedAngle] = [];
  }
  angleGroups[roundedAngle].push(line);
});

const pointsVariables = {};
let counter = 1;

uniquePoints.forEach(point => {
  pointsVariables[`pointCoord${counter}`] = point;
  counter++;
});


const svgElement = document.querySelector('svg');

function updateViewportSize() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let translateX = '';
  let translateY = '';
  if (viewportWidth < 420) {
    translateX = `${-viewportWidth * 3}px`
    translateY = `${-viewportHeight * 3}px`
  } else if (viewportWidth < 820) {
    translateX = `${-viewportWidth * 5 / 3}px`
    translateY = `${-viewportHeight * 4 / 3}px`
  } else {
    translateX = `${-viewportWidth}px`
    translateY = `${-viewportHeight * 2 / 3}px`
  }

  svgElement.style.setProperty('--translate-x', translateX);
  svgElement.style.setProperty('--translate-y', translateY);
}

updateViewportSize();

window.addEventListener('resize', updateViewportSize);

faces.forEach((faceData, index) => {
  const face = createFace(faceData.points, faceData.color, faceDelay);
  svgElement.appendChild(face);
  if ((index + 1) % 4 === 0) {
    faceDelay += faceDelayIncrement;
  }
});

Object.keys(angleGroups).forEach(angle => {
  angleGroups[angle].forEach(line => {
    const length = line.getTotalLength();
    line.style.setProperty('--line-length', length);
    line.style.animationDelay = `${lineDelay}s`;
  });
  lineDelay += lineDelayIncrement;
});

function renderServices() {
  const services = document.querySelector('#services');
  const allLines = services.querySelectorAll('h4,h5');
  let serviceLineDelay = 14;
  allLines.forEach(line => {
    line.style.animationDelay = `${serviceLineDelay}s`;
    serviceLineDelay += lineDelayIncrement;
  })
}




function getTransformedCoordinates() {
  const tesseract = document.querySelector('#tesseract');
  const tesseractRect = tesseract.getBoundingClientRect();
  console.log({ tesseractRect })
  const transformedX = tesseractRect.right - 0.5;
  const transformedY = tesseractRect.top + tesseractRect.height / 2;
  console.log({ x: transformedX, y: transformedY })
  return { x: transformedX, y: transformedY };
}


window.setTimeout(() => {
  const { x, y } = getTransformedCoordinates();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const x2 = Math.min(x + viewportWidth / 2, viewportWidth); // Ensure x2 is within the viewport
  const svgLineDef = `
  <?xml version="1.0"?>
  <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" version="1.0">

  <g class="layertwo">
    <title>Layer 2</title>
      <g id="svg_linetwo_1" stroke="#000000" stroke-opacity="1" stroke-width="1">
        <line id="secondline" x1="${x}" x2="${x2}" y1="${y}" y2="${y}"/>
      </g>
    </g>
  </svg>`;
  const svgContainerTwo = document.querySelector('#svgContainerTwo');
  svgContainerTwo.innerHTML = svgLineDef;
  const secondline = svgContainerTwo.querySelector('#secondline');
  const length = secondline.getTotalLength();
  secondline.style.setProperty('--line-length', length);
  const headline = document.querySelector('#headline');
  const services = document.querySelector('#services');
  const textfirstline = headline.querySelector('#textfirstline');
  const textsecondline = headline.querySelector('#textsecondline');
  if (viewportWidth < 450) {
    textfirstline.style.top = `${y - 65}px`;
    textsecondline.style.top = `${y - 2}px`;
  } else if (viewportWidth < 520) {
    textfirstline.style.top = `${y - 75}px`;
    textsecondline.style.top = `${y - 4}px`;
  } else if (viewportWidth < 630) {
    textfirstline.style.top = `${y - 85}px`;
    textsecondline.style.top = `${y - 6}px`;
  } else if (viewportWidth < 740) {
    textfirstline.style.top = `${y - 90}px`;
    textsecondline.style.top = `${y - 8}px`;
  } else if (viewportWidth < 860) {
    if (viewportHeight < 420) {
      textfirstline.style.top = `${y - 75}px`;
      textsecondline.style.top = `${y - 10}px`;
    } else {
      textfirstline.style.top = `${y - 95}px`;
      textsecondline.style.top = `${y - 10}px`;
    }
  } else if (viewportWidth < 980) {
    textfirstline.style.top = `${y - 100}px`;
    textsecondline.style.top = `${y - 10}px`;
  } else if (viewportWidth < 1160) {
    textfirstline.style.top = `${y - 130}px`;
    textsecondline.style.top = `${y - 20}px`;
  } else {
    textfirstline.style.top = `${y - 160}px`;
    textsecondline.style.top = `${y - 30}px`;
  }
  
  
  if (viewportHeight < 450) {
    services.style.top = `${y + 70}px`;
  } else {
    services.style.top = `${y + 120}px`;
  }
  if (viewportWidth > 450) {
    services.style.left = `${x / 2}px`;
  } else {
    services.style.left = `6px`;
  }
  renderServices()
  textfirstline.style.left = `${x}px`;
  textsecondline.style.left = `${x}px`;
}, 10000); 