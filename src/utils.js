function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHexColor(limits) {
  if (limits.length !== 6) {
    throw new Error("Invalid limits array length. It should be of length 6.");
  }

  const hexChars = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    const limit = limits[i];
    const minIndex = hexChars.indexOf(limit[0]);
    const maxIndex = hexChars.indexOf(limit[1]);

    if (minIndex === -1 || maxIndex === -1 || minIndex > maxIndex) {
      throw new Error(`Invalid limit at position ${i}.`);
    }

    const randomIndex = getRandomInt(minIndex, maxIndex);
    color += hexChars[randomIndex];
  }

  return color;
}

function getRandomValueFromArray(arr) {
  if (arr.length === 0) {
    throw new Error("Array is empty");
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function rotate(cube, axis, times) {
  const temp = cube.split("");
  for (let t = 0; t < times; t++) {
    let order;
    if (axis === "x") order = [4, 5, 2, 3, 0, 1];
    else if (axis === "y") order = [1, 0, 4, 5, 2, 3];
    else order = [2, 3, 0, 1, 4, 5];

    const newCube = new Array(6);
    for (let i = 0; i < 6; i++) {
      newCube[i] = temp[order[i]];
    }
    temp.splice(0, 6, ...newCube);
  }
  return temp.join("");
}

function getAllRotations(cube) {
  const rotations = new Set();
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      for (let z = 0; z < 4; z++) {
        const rotatedCube = rotate(
          rotate(rotate(cube, "x", x), "y", y),
          "z",
          z
        );
        rotations.add(rotatedCube);
      }
    }
  }
  return Array.from(rotations);
}


module.exports = {
    getRandomInt,
    randomHexColor,
    getRandomValueFromArray,
    rotate,
    getAllRotations
}