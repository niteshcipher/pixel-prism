import { OrbitControls } from 'three/examples/jsm/Addons.js';
import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

// variables
// const pointsUI = document.querySelector('#points');
let points = 0;
let gameOver = false;

// Create replay button
const replayButton = document.createElement('button');
replayButton.textContent = 'Play Again';
replayButton.style.position = 'absolute';
replayButton.style.top = '20px';
replayButton.style.right = '20px'; // Changed to right side
replayButton.style.padding = '10px 20px';
replayButton.style.fontSize = '16px';
replayButton.style.backgroundColor = '#ff4444';
replayButton.style.color = 'white';
replayButton.style.border = 'none';
replayButton.style.borderRadius = '5px';
replayButton.style.cursor = 'pointer';
replayButton.style.display = 'none'; // Hide initially
document.body.appendChild(replayButton);

const randomRangeNum = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const moveObstacles = (arr, speed, maxX, minX, maxZ, minZ) => {
  arr.forEach((e1) => {
    e1.body.position.z += speed;
    if (e1.body.position.z > camera.position.z) {
      e1.body.position.x = randomRangeNum(maxX, minX);
      e1.body.position.z = randomRangeNum(maxZ, minZ);
    }
    e1.mesh.position.copy(e1.body.position);
    e1.mesh.quaternion.copy(e1.body.quaternion);
  });
};

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0047ab, 0.09);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -5, 0), // Reduced gravity
});

const cannonDebugger = new CannonDebugger(scene, world, {
  color: '#AEEF2F',
  scale: 1,
});

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Ground
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(15, 0.5, 15)),
});
groundBody.position.y = -1;
world.addBody(groundBody);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(30, 1, 30),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
ground.position.y = -1;
scene.add(ground);

// Player
const playerBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)),
  fixedRotation: true,
});
world.addBody(playerBody);

const player = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.5, 0.5),
  new THREE.MeshBasicMaterial({ color:	0xFF0000})
);
scene.add(player);

// Powerups
const powerups = [];
for (let i = 0; i < 10; i++) {
  const posX = randomRangeNum(8, -8);
  const posZ = randomRangeNum(-5, -10);

  const powerup = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.05, 16, 50),
    new THREE.MeshBasicMaterial({ color: 0xCDB4DB })
  );
  powerup.position.set(posX, 0, posZ);
  scene.add(powerup);

  const powerupBody = new CANNON.Body({
    shape: new CANNON.Sphere(0.2),
  });
  powerupBody.position.set(posX, 0, posZ);
  world.addBody(powerupBody);

  powerups.push({ mesh: powerup, body: powerupBody });
}

// Enemies
const enemies = [];
for (let i = 0; i < 3; i++) {
  const posX = randomRangeNum(8, -8);
  const posZ = randomRangeNum(-5, -10);

  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00FFFF })
  );
  enemy.position.set(posX, 0, posZ);
  scene.add(enemy);

  const enemyBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
  });
  enemyBody.position.set(posX, 0, posZ);
  world.addBody(enemyBody);

  enemies.push({ mesh: enemy, body: enemyBody });
}

// Particles
const geometry = new THREE.BufferGeometry();
const vertices = [];
const size = 2000;

for (let i = 0; i < size; i++) {
  const x = (Math.random() * size + Math.random() * size) / 2 - size / 2;
  const y = (Math.random() * size + Math.random() * size) / 2 - size / 2;
  const z = (Math.random() * size + Math.random() * size) / 2 - size / 2;
  vertices.push(x, y, z);
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

const material = new THREE.PointsMaterial({
  size: 2,
  color: 0xffffff,
});
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Collision Handling
playerBody.addEventListener('collide', (e) => {
  powerups.forEach((p) => {
    if (e.body === p.body) {
      p.body.position.x = randomRangeNum(8, -8);
      p.body.position.z = randomRangeNum(-5, -10);
      p.mesh.position.copy(p.body.position);
      p.mesh.quaternion.copy(p.body.quaternion);
      points += 1;
      pointsUI.textContent = points.toString();
    }
  });

  enemies.forEach((en) => {
    if (e.body === en.body) {
      gameOver = true;
      replayButton.style.display = 'block';
    }
  });
});

// Reset game function
function resetGame() {
  // Reset game state
  gameOver = false;
  points = 0;
  pointsUI.textContent = '0';
  replayButton.style.display = 'none';
  
  // Reset player position
  playerBody.position.set(0, 0, 0);
  playerBody.velocity.set(0, 0, 0);
  playerBody.angularVelocity.set(0, 0, 0);
  
  // Make sure player body is active
  playerBody.sleepState = 0;
  playerBody.wakeUp();
  
  // Reset obstacles positions
  powerups.forEach((p) => {
    p.body.position.x = randomRangeNum(8, -8);
    p.body.position.z = randomRangeNum(-5, -10);
    p.mesh.position.copy(p.body.position);
  });
  
  enemies.forEach((en) => {
    en.body.position.x = randomRangeNum(8, -8);
    en.body.position.z = randomRangeNum(-5, -10);
    en.mesh.position.copy(en.body.position);
  });
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  particles.rotation.x += 0.0002;
  particles.rotation.y += 0.0002;
  particles.rotation.z += 0.0005;

  if (!gameOver) {
    moveObstacles(powerups, 0.025, 8, -8, -5, -10);
    moveObstacles(enemies, 0.04, 8, -8, -5, -10);
  } else {
    pointsUI.textContent = `Game Over - Score: ${points}`;
    playerBody.velocity.set(0, 2, 2);
  }

  controls.update();
  world.step(1/60);

  player.position.copy(playerBody.position);
  player.quaternion.copy(playerBody.quaternion);

  cannonDebugger.update();
  renderer.render(scene, camera);
}

// Event Listeners
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Control flags to prevent multiple key presses
let keyStates = {
  left: false,
  right: false,
  jump: false
};

window.addEventListener('keydown', (e) => {
  if (gameOver) return;
  
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
    keyStates.right = true;
    playerBody.position.x += 0.03;
  }
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
    keyStates.left = true;
    playerBody.position.x -= 0.03;
  }
  if (e.key === 'r' || e.key === 'R') {
    playerBody.position.set(0, 0, 0);
  }
  if (e.key === ' ') {
    keyStates.jump = true;
    if (Math.abs(playerBody.position.y) < 0.5) {
      playerBody.velocity.y = 2;
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
    keyStates.right = false;
  }
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
    keyStates.left = false;
  }
  if (e.key === ' ') {
    keyStates.jump = false;
  }
});

// Replay button handler
replayButton.addEventListener('click', () => {
  resetGame();
  // Force the player to be properly reset and active
  scene.remove(player);
  scene.add(player);
  player.position.copy(playerBody.position);
});

// Start animation
animate();
