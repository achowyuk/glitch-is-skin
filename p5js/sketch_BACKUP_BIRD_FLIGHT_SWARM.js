/* 
 * GLITCH IS SKIN - BACKUP (BIRD FLIGHT & CHAIN SWARM)
 * Saved on: Monday, March 16, 2026
 * 
 * Features:
 * - 1/3 Size mini-clones with high-density point sampling (25%)
 * - Bird Flight / Chain Pattern: Clones follow each other in a fluid sequence
 * - Sensual, low-lerp movement with noise-based drift
 * - Extreme Triple-Layered Supernova Glow
 * - 50% screen travel range for joystick
 */

let serial;
let joyX = 512, joyY = 512, sw = 0;
let normX = 0, normY = 0; 

let silhouetteImg, bgManager;
let particles = [];
let imgStatus = "LOADING...";
let pointDensity = 8; 

let ruptureTimer = 0;
const RUPTURE_STAGES = { IDLE: 0, BURST: 1, REBIRTH: 2 };
let currentStage = RUPTURE_STAGES.IDLE;
let rebirthStartTime = 0;
const rebirthDuration = 2500; 
let ruptureType = 0; 

let glitchIntensity = 0;
let persistentClones = []; 
const MAX_CLONES = 8; 

let dirHoldStartTime = 0;
let isAssembling = false;
let isTouching = false;
const ASSEMBLY_HOLD_TIME = 2000; 
let touchStartTime = 0;
let lastBgChangeTime = 0;
let hasFirstMovementOccurred = false; 

const DIRS = { NONE: 0, UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4, DIAGONAL: 5 };
let currentDir = DIRS.NONE;
let lastDir = DIRS.NONE;

function preload() {
  silhouetteImg = loadImage('assets/silhouette.png');
  bgManager = new BackgroundManager();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(40); 
  bgManager.loadAndProcess();
  serial = createSerial();
  const connectBtn = document.getElementById('connect-btn');
  connectBtn.onclick = () => { if (!serial.opened()) serial.open(115200); };
  if (silhouetteImg) { imgStatus = "READY"; processSilhouette(); }
}

function processSilhouette() {
  particles = [];
  silhouetteImg.loadPixels();
  let imgW = silhouetteImg.width;
  let imgH = silhouetteImg.height;
  for (let y = 0; y < imgH; y += pointDensity) {
    for (let x = 0; x < imgW; x += pointDensity) {
      let index = (x + y * imgW) * 4;
      if (silhouetteImg.pixels[index + 3] > 50) { 
        particles.push(new Particle(x, y, imgW, imgH));
      }
    }
  }
}

function draw() {
  bgManager.display();
  drawDreamyHaze();

  if (serial && serial.opened()) {
    let count = 0;
    while (serial.available() > 0 && count < 5) {
      let data = serial.readUntil('\n');
      if (data && data.trim()) {
        let parts = data.trim().split(",");
        if (parts.length === 3) {
          joyX = parseInt(parts[0]);
          joyY = parseInt(parts[1]);
          let newSw = parseInt(parts[2]);
          if (newSw === 1 && sw === 0 && currentStage === RUPTURE_STAGES.IDLE) initiateRupture();
          sw = newSw;
          normX = map(joyX, 0, 1023, -1, 1);
          normY = map(joyY, 0, 1023, -1, 1);
          if (abs(normX) < 0.12) normX = 0;
          if (abs(normY) < 0.12) normY = 0;
          glitchIntensity = dist(0, 0, normX, normY);
          updateDirection();
          if (glitchIntensity > 0.25) hasFirstMovementOccurred = true;
          if (hasFirstMovementOccurred && currentDir !== lastDir && currentDir !== DIRS.NONE) {
            if (persistentClones.length >= MAX_CLONES) persistentClones.shift();
            persistentClones.push(new MiniClone());
            if (millis() - lastBgChangeTime > 500) { bgManager.next(); lastBgChangeTime = millis(); }
          }
          if (currentDir === lastDir && currentDir !== DIRS.NONE) {
            if (millis() - dirHoldStartTime > ASSEMBLY_HOLD_TIME) isAssembling = true;
          } else { dirHoldStartTime = millis(); isAssembling = false; }
          lastDir = currentDir;
        }
      }
      count++;
    }
  }

  let currentlyTouching = false;
  for (let c of persistentClones) {
    if (dist(c.x, c.y, 0, 0) < 100) { currentlyTouching = true; break; }
  }
  if (currentlyTouching) {
    if (touchStartTime === 0) touchStartTime = millis();
    if (millis() - touchStartTime > ASSEMBLY_HOLD_TIME) isTouching = true;
  } else { touchStartTime = 0; isTouching = false; }

  updateStatusUI();
  drawFrayingEdges();

  push();
  translate(width/2, height/2);
  for (let i = 0; i < persistentClones.length; i++) {
    let lx, ly;
    if (i === 0) { lx = normX * (width * 0.5); ly = normY * (height * 0.5); }
    else { lx = persistentClones[i-1].x; ly = persistentClones[i-1].y; }
    persistentClones[i].update(lx, ly);
    persistentClones[i].display();
  }
  if (currentStage !== RUPTURE_STAGES.IDLE) handleRuptureLogic();
  else { drawGhosts(); drawMainAvatar(); }
  pop();
  drawJoystickIndicator();
}

class MiniClone {
  constructor() {
    this.x = 0; this.y = 0;
    this.size = 1/3; 
    this.indices = [];
    this.history = []; 
    for (let i = 0; i < particles.length; i++) if (random() < 0.25) this.indices.push(i);
    this.driftSeed = random(1000);
    let angle = random(TWO_PI);
    let d = random(180, 280);
    this.formX = cos(angle) * d;
    this.formY = sin(angle) * d;
  }
  update(lx, ly) {
    if (glitchIntensity < 0.05 && !isAssembling) return;
    let tx, ty;
    if (isAssembling) { tx = this.formX; ty = this.formY; } 
    else {
      let noiseX = (noise(frameCount * 0.02, this.driftSeed) - 0.5) * 20;
      let noiseY = (noise(this.driftSeed, frameCount * 0.02) - 0.5) * 20;
      tx = lx + noiseX; ty = ly + noiseY;
    }
    this.x = lerp(this.x, tx, 0.07);
    this.y = lerp(this.y, ty, 0.07);
    this.history.push({x: this.x, y: this.y});
    if (this.history.length > 8) this.history.shift(); 
  }
  display() {
    push();
    scale(this.size);
    for (let i = 0; i < this.history.length; i++) {
      let h = this.history[i];
      let alpha = map(i, 0, this.history.length, 0, 40);
      push(); translate(h.x * 3, h.y * 3); stroke(140, 170, 255, alpha); strokeWeight(3); 
      for (let idx of this.indices) { point(particles[idx].x, particles[idx].y); }
      pop();
    }
    translate(this.x * 3, this.y * 3);
    let showGlow = isAssembling || isTouching;
    if (showGlow) {
      let pulse = (sin(frameCount * 0.2) + 1) / 2;
      let bloomSize = map(pulse, 0, 1, 20, 60);
      stroke(200, 230, 255, 80 * pulse); strokeWeight(bloomSize); 
      for (let idx of this.indices) { if (random() < 0.2) point(particles[idx].x, particles[idx].y); }
      stroke(255, 255, 255, 150 + (105 * pulse)); strokeWeight(map(pulse, 0, 1, 10, 25)); 
      for (let idx of this.indices) { if (random() < 0.4) point(particles[idx].x, particles[idx].y); }
    }
    stroke(255, 255, 255, showGlow ? 255 : 120); strokeWeight(showGlow ? 8 : 5); 
    for (let idx of this.indices) { point(particles[idx].x, particles[idx].y); }
    pop();
  }
}

function updateDirection() {
  if (glitchIntensity < 0.2) { currentDir = DIRS.NONE; return; }
  let angle = atan2(normY, normX);
  if (angle < 0) angle += TWO_PI;
  let slice = PI / 4;
  if (angle < slice/2 || angle > TWO_PI - slice/2) currentDir = DIRS.RIGHT;
  else if (angle < PI/2 + slice/2 && angle > PI/2 - slice/2) currentDir = DIRS.DOWN;
  else if (angle < PI + slice/2 && angle > PI - slice/2) currentDir = DIRS.LEFT;
  else if (angle < 3*PI/2 + slice/2 && angle > 3*PI/2 - slice/2) currentDir = DIRS.UP;
  else currentDir = DIRS.DIAGONAL;
}

class Particle {
  constructor(x, y, imgW, imgH) {
    this.originX = (x - imgW/2) * 1.35; this.originY = (y - imgH/2) * 1.35;
    this.x = this.originX; this.y = this.originY;
    this.lastX = this.x; this.lastY = this.y;
    this.vx = 0; this.vy = 0;
    this.baseSize = random(1.5, 3);
    let c = random(180, 230);
    this.baseColor = color(c, c + random(-10, 10), c + random(10, 25));
  }
  update() {
    if (currentStage === RUPTURE_STAGES.BURST) {
      this.x += this.vx; this.y += this.vy;
      if (ruptureType === 0) this.vy += 0.5; 
      else { this.vx += sin(frameCount * 0.2 + this.originX) * 0.4; this.vy *= 0.98; }
    } else if (currentStage === RUPTURE_STAGES.REBIRTH) {
      let t = constrain((millis() - rebirthStartTime) / rebirthDuration, 0, 1);
      this.x = lerp(this.lastX, this.originX, t * t);
      this.y = lerp(this.lastY, this.originY, t * t);
    }
  }
  display(offsetX = 0, offsetY = 0, alpha = 255, isGhost = false) {
    let px = this.x + offsetX; let py = this.y + offsetY;
    let burstGlow = 0;
    if (currentStage === RUPTURE_STAGES.REBIRTH) {
       let elapsed = millis() - rebirthStartTime;
       if (elapsed < 400) burstGlow = map(elapsed, 0, 400, 10, 0); 
    }
    if (!isGhost && glitchIntensity > 0.2) {
      let activeDir = currentDir === DIRS.DIAGONAL ? floor(random(1, 5)) : currentDir;
      if (activeDir === DIRS.UP) { if (random() < 0.1) py += random(-40, 40); }
      else if (activeDir === DIRS.DOWN) py += random(0, 15);
      else if (activeDir === DIRS.LEFT) { if (random() < 0.2) px += random(-30, 0); }
      else if (activeDir === DIRS.RIGHT) px = floor(px/10)*10 + random(-5, 5);
    }
    strokeWeight(this.baseSize + burstGlow);
    if (burstGlow > 5) stroke(255, 255, 255, 200); 
    else { let c = this.baseColor; stroke(red(c), green(c), blue(c), alpha); }
    point(px, py);
  }
}

function drawMainAvatar() {
  let pulse = (sin(frameCount * 0.15) + 1) / 2;
  let showGlow = isAssembling || isTouching;
  for (let p of particles) {
    if (showGlow) {
       if (random() < 0.1) { stroke(180, 220, 255, 20 + 40 * pulse); strokeWeight(p.baseSize * 15 * pulse); point(p.x, p.y); }
       if (random() < 0.2) { stroke(255, 255, 255, 100 + 155 * pulse); strokeWeight(p.baseSize * 6 * pulse); point(p.x, p.y); }
    } else { if (random() < 0.03) { stroke(200, 230, 255, 20 + 20 * pulse); strokeWeight(p.baseSize * 2); point(p.x, p.y); } }
    p.update(); p.display();
  }
}

function drawGhosts() {
  if (glitchIntensity < 0.15) return;
  for (let i = 1; i <= 2; i++) {
    let alpha = map(i, 0, 2, 15, 5);
    let offX = normX * i * (width * 0.15); let offY = normY * i * (height * 0.15);
    for (let p of particles) if (random() < 0.05) p.display(offX, offY, alpha, true);
  }
}

function initiateRupture() {
  currentStage = RUPTURE_STAGES.BURST; ruptureTimer = millis(); ruptureType = (ruptureType + 1) % 2; 
  persistentClones = []; isAssembling = false;
  for (let p of particles) {
    if (ruptureType === 0) { p.vx = random(-10, 10); p.vy = random(5, 25); } 
    else { let ang = random(TWO_PI); let mag = random(15, 45); p.vx = cos(ang) * mag; p.vy = sin(ang) * mag - 10; }
  }
}

function handleRuptureLogic() {
  let elapsed = millis() - ruptureTimer;
  if (currentStage === RUPTURE_STAGES.BURST && elapsed > 1000) { 
    currentStage = RUPTURE_STAGES.REBIRTH; rebirthStartTime = millis(); 
    for (let p of particles) { p.lastX = p.x; p.lastY = p.y; }
  } else if (currentStage === RUPTURE_STAGES.REBIRTH) {
    if (millis() - rebirthStartTime > rebirthDuration) {
      currentStage = RUPTURE_STAGES.IDLE;
      for (let p of particles) { p.x = p.originX; p.y = p.originY; }
    }
  }
  for (let p of particles) { p.update(); p.display(); }
}

function drawDreamyHaze() {
  push(); noFill();
  for (let i = 0; i < 60; i += 15) {
    stroke(120, 170, 255, map(i, 0, 60, 10, 0));
    strokeWeight(15); rect(i, i, width - i*2, height - i*2, 100);
  }
  pop();
}

function drawFrayingEdges() {
  noFill();
  for (let i = 0; i < 40; i += 20) { stroke(200, 200, 255, 5); rect(i, i, width - i*2, height - i*2); }
}

function drawJoystickIndicator() {
  push(); translate(width - 120, height - 120);
  stroke(100, 100, 100, 50); strokeWeight(3);
  for(let i=0; i<50; i++) { let a = random(TWO_PI); let r = random(70, 78); point(cos(a)*r, sin(a)*r); }
  let jx = normX * 55; let jy = normY * 55;
  stroke(168, 169, 173, 200); 
  for(let i=0; i<60; i++) { let a = random(TWO_PI); let r = random(18); strokeWeight(random(1, 5)); point(jx + cos(a)*r, jy + sin(a)*r); }
  pop();
}

function updateStatusUI() {
  document.getElementById('stat-image').innerText = imgStatus;
  document.getElementById('stat-joy').innerText = `${joyX}, ${joyY}`;
  let isOpened = (serial && typeof serial.opened === 'function') ? serial.opened() : false;
  document.getElementById('stat-serial').innerText = isOpened ? "CONNECTED" : "IDLE";
  if (isOpened) document.getElementById('ui-overlay').style.display = 'none';
  let stateText = isAssembling ? "ASSEMBLED" : (isTouching ? "COLLIDING" : (currentStage !== RUPTURE_STAGES.IDLE ? "RUPTURED" : "COHERENT"));
  document.getElementById('stat-state').innerText = stateText;
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); if (bgManager) bgManager.loadAndProcess(); if (silhouetteImg) processSilhouette(); }
