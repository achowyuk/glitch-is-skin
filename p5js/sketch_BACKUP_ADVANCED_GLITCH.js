/* 
 * GLITCH IS SKIN - BACKUP (ADVANCED GLITCH & SHADOWS)
 * Saved on: Monday, March 16, 2026
 * 
 * Features:
 * - Direction-specific glitching (Up: Stretch, Down: Melt, Left: Tear, Right: Blocky)
 * - Drifting Shadow Silhouettes (shed skins) that spawn on movement
 * - High-flux spawning when holding the joystick at full pressure
 * - Banner slowed to 75s
 */

let serial;
let joyX = 512, joyY = 512, sw = 0;
let normX = 0, normY = 0; 

let silhouetteImg, bgImg, pixelatedBg;
let particles = [];
let imgStatus = "LOADING...";
let pointDensity = 8; 

let ruptureTimer = 0;
const RUPTURE_STAGES = { IDLE: 0, BURST: 1, SETTLE: 2, REBIRTH: 3 };
let currentStage = RUPTURE_STAGES.IDLE;
let ruptureType = 0; 

let glitchIntensity = 0;
let lastSpawnTime = 0;
let driftGhosts = []; 

const DIRS = { NONE: 0, UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4, DIAGONAL: 5 };
let currentDir = DIRS.NONE;

function preload() {
  silhouetteImg = loadImage('assets/silhouette.png');
  bgImg = loadImage('assets/background2.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(45); 
  if (bgImg) createPixelatedBackground();
  serial = createSerial();
  const connectBtn = document.getElementById('connect-btn');
  connectBtn.onclick = () => {
    if (!serial.opened()) {
      serial.open(115200); 
    }
  };
  if (silhouetteImg) {
    imgStatus = "READY";
    processSilhouette();
  }
}

function createPixelatedBackground() {
  let pixelSize = 6; 
  let w = ceil(width / pixelSize);
  let h = ceil(height / pixelSize);
  pixelatedBg = createGraphics(w, h);
  pixelatedBg.noSmooth();
  pixelatedBg.image(bgImg, 0, 0, w, h);
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
  if (pixelatedBg) {
    push();
    noSmooth();
    image(pixelatedBg, 0, 0, width, height);
    fill(13, 13, 18, 200); 
    rect(0, 0, width, height);
    pop();
  } else {
    background(13, 13, 18);
  }
  
  try {
    if (serial && serial.opened() && serial.available() > 0) {
      let data = "";
      if (typeof serial.readUntil === 'function') data = serial.readUntil('\n');
      else if (typeof serial.readStringUntil === 'function') data = serial.readStringUntil('\n');
      else if (typeof serial.readString === 'function') data = serial.readString();
      if (data && data.trim()) {
        let lines = data.trim().split("\n");
        let lastLine = lines[lines.length - 1]; 
        let parts = lastLine.split(",");
        if (parts.length === 3) {
          joyX = parseInt(parts[0]);
          joyY = parseInt(parts[1]);
          let newSw = parseInt(parts[2]);
          if (newSw === 1 && sw === 0 && currentStage === RUPTURE_STAGES.IDLE) {
            initiateRupture();
          }
          sw = newSw;
          normX = map(joyX, 0, 1023, -1, 1);
          normY = map(joyY, 0, 1023, -1, 1);
          if (abs(normX) < 0.15) normX = 0;
          if (abs(normY) < 0.15) normY = 0;
          glitchIntensity = dist(0, 0, normX, normY);
          updateDirection();
        }
      }
    }
  } catch (e) { console.warn("Serial data error:", e); }

  handleDriftSpawning();
  updateStatusUI();
  drawFrayingEdges();

  push();
  translate(width/2, height/2);
  for (let i = driftGhosts.length - 1; i >= 0; i--) {
    driftGhosts[i].update();
    driftGhosts[i].display();
    if (driftGhosts[i].alpha <= 0) driftGhosts.splice(i, 1);
  }
  if (currentStage !== RUPTURE_STAGES.IDLE) {
    handleRuptureLogic();
  } else {
    drawGhosts();
    drawMainAvatar();
  }
  pop();
  drawJoystickIndicator();
}

function updateDirection() {
  if (glitchIntensity < 0.2) {
    currentDir = DIRS.NONE;
    return;
  }
  let angle = atan2(normY, normX);
  if (angle < 0) angle += TWO_PI;
  let slice = PI / 4;
  if (angle < slice/2 || angle > TWO_PI - slice/2) currentDir = DIRS.RIGHT;
  else if (angle < PI/2 + slice/2 && angle > PI/2 - slice/2) currentDir = DIRS.DOWN;
  else if (angle < PI + slice/2 && angle > PI - slice/2) currentDir = DIRS.LEFT;
  else if (angle < 3*PI/2 + slice/2 && angle > 3*PI/2 - slice/2) currentDir = DIRS.UP;
  else currentDir = DIRS.DIAGONAL;
}

function handleDriftSpawning() {
  if (currentDir === DIRS.NONE) return;
  let now = millis();
  let interval = 800; 
  if (glitchIntensity > 0.8) interval = 300;
  if (now - lastSpawnTime > interval) {
    let count = (glitchIntensity > 0.8) ? floor(random(1, 4)) : 1;
    for (let i = 0; i < count; i++) spawnDriftGhost();
    lastSpawnTime = now;
  }
}

function spawnDriftGhost() {
  let sizeMod = random(0.5, 1.5);
  let velX = normX * random(2, 5) + random(-1, 1);
  let velY = normY * random(2, 5) + random(-1, 1);
  driftGhosts.push(new DriftGhost(velX, velY, sizeMod));
}

class DriftGhost {
  constructor(vx, vy, sizeMod) {
    this.x = 0; this.y = 0;
    this.vx = vx; this.vy = vy;
    this.sizeMod = sizeMod;
    this.alpha = 150;
    this.fadeRate = random(1, 3);
    this.indices = [];
    for (let i = 0; i < particles.length; i++) {
      if (random() < 0.2) this.indices.push(i);
    }
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.alpha -= this.fadeRate;
  }
  display() {
    push();
    translate(this.x, this.y);
    scale(this.sizeMod);
    for (let idx of this.indices) {
      let p = particles[idx];
      stroke(200, 200, 255, this.alpha * 0.3);
      strokeWeight(p.baseSize);
      point(p.x, p.y);
    }
    pop();
  }
}

class Particle {
  constructor(x, y, imgW, imgH) {
    this.originX = x - imgW/2;
    this.originY = y - imgH/2;
    this.x = this.originX;
    this.y = this.originY;
    this.baseSize = random(1.5, 3);
    let c = random(180, 230);
    this.baseColor = color(c, c + random(-10, 10), c + random(10, 25));
  }
  update() {
    if (currentStage === RUPTURE_STAGES.BURST) {
      this.x += this.vx; this.y += this.vy;
      if (ruptureType === 0) this.vy += 0.2; 
      else { this.vx += sin(frameCount * 0.1 + this.originX) * 0.1; this.vy *= 0.98; }
    } else if (currentStage === RUPTURE_STAGES.SETTLE) {
       if (ruptureType === 0) this.y = min(this.y + 2, height/3 + random(10));
    } else if (currentStage === RUPTURE_STAGES.REBIRTH) {
      this.x = lerp(this.x, this.originX, 0.05);
      this.y = lerp(this.y, this.originY, 0.05);
    }
  }
  display(offsetX = 0, offsetY = 0, alpha = 255, isGhost = false) {
    let px = this.x + offsetX;
    let py = this.y + offsetY;
    if (!isGhost && glitchIntensity > 0.2) {
      let activeDir = currentDir;
      if (activeDir === DIRS.DIAGONAL) activeDir = floor(random(1, 5));
      if (activeDir === DIRS.UP) py += sin(frameCount * 0.2 + px * 0.05) * 15 * glitchIntensity;
      else if (activeDir === DIRS.DOWN) py += random(0, 10) * glitchIntensity;
      else if (activeDir === DIRS.LEFT) { if (random() < 0.3) px += random(-30, 0) * glitchIntensity; }
      else if (activeDir === DIRS.RIGHT) px = floor(px/10)*10 + random(-5, 5)*glitchIntensity;
    }
    push();
    strokeWeight(this.baseSize);
    if (!isGhost && glitchIntensity > 0.6) {
      if (currentDir === DIRS.LEFT || currentDir === DIRS.RIGHT) {
        stroke(255, 0, 50, alpha * 0.4); point(px + 10 * glitchIntensity, py);
        stroke(0, 255, 255, alpha * 0.4); point(px - 10 * glitchIntensity, py);
      } else if (currentDir === DIRS.UP || currentDir === DIRS.DOWN) {
        stroke(255, 200, 50, alpha * 0.4); point(px, py + 10 * glitchIntensity);
      }
    }
    let c = this.baseColor;
    stroke(red(c), green(c), blue(c), alpha);
    point(px, py);
    pop();
  }
}

function drawMainAvatar() {
  for (let p of particles) { p.update(); p.display(); }
  if (glitchIntensity > 0.4) {
    stroke(255, 255, 255, 15 * glitchIntensity);
    if (currentDir === DIRS.LEFT || currentDir === DIRS.RIGHT) {
       for(let i = -height/2; i < height/2; i += 15) if (random() < 0.1) line(-width/2, i, width/2, i);
    } else if (currentDir === DIRS.UP || currentDir === DIRS.DOWN) {
       for(let i = -width/2; i < width/2; i += 15) if (random() < 0.1) line(i, -height/2, i, height/2);
    }
  }
}

function drawGhosts() {
  if (glitchIntensity < 0.15) return;
  let numGhosts = floor(map(glitchIntensity, 0, 1, 0, 3));
  for (let i = 1; i <= numGhosts; i++) {
    let alpha = map(i, 0, 3, 20, 5) * glitchIntensity;
    let offX = normX * i * 60;
    let offY = normY * i * 60;
    for (let p of particles) if (random() < 0.15) p.display(offX, offY, alpha, true);
  }
}

function initiateRupture() {
  currentStage = RUPTURE_STAGES.BURST;
  ruptureTimer = millis();
  ruptureType = (ruptureType + 1) % 2; 
  for (let p of particles) {
    if (ruptureType === 0) { p.vx = random(-2, 2); p.vy = random(-2, 5); } 
    else { 
      let ang = random(TWO_PI); let mag = random(5, 15);
      p.vx = cos(ang) * mag; p.vy = sin(ang) * mag - 5;
    }
  }
}

function handleRuptureLogic() {
  let elapsed = millis() - ruptureTimer;
  if (currentStage === RUPTURE_STAGES.BURST && elapsed > 1500) currentStage = RUPTURE_STAGES.SETTLE;
  else if (currentStage === RUPTURE_STAGES.SETTLE && elapsed > 3500) currentStage = RUPTURE_STAGES.REBIRTH;
  else if (currentStage === RUPTURE_STAGES.REBIRTH && elapsed > 6000) currentStage = RUPTURE_STAGES.IDLE;
  for (let p of particles) { p.update(); p.display(); }
}

function drawFrayingEdges() {
  noFill();
  for (let i = 0; i < 50; i += 5) {
    stroke(200, 200, 255, map(i, 0, 50, 15, 0));
    rect(i, i, width - i*2, height - i*2);
  }
}

function drawJoystickIndicator() {
  push();
  translate(width - 60, height - 60);
  noFill(); stroke(255, 50); ellipse(0, 0, 40, 40);
  fill(255, 150); noStroke(); ellipse(normX * 15, normY * 15, 8, 8);
  pop();
}

function updateStatusUI() {
  document.getElementById('stat-image').innerText = imgStatus;
  document.getElementById('stat-joy').innerText = `${joyX}, ${joyY}`;
  let isOpened = serial.opened();
  document.getElementById('stat-serial').innerText = isOpened ? "CONNECTED" : "IDLE";
  if (isOpened) document.getElementById('ui-overlay').style.display = 'none';
  let stateText = "COHERENT";
  if (currentStage !== RUPTURE_STAGES.IDLE) stateText = "RUPTURED";
  else if (glitchIntensity > 0.7) stateText = "UNSTABLE";
  else if (glitchIntensity > 0.2) stateText = "MAPPING";
  document.getElementById('stat-state').innerText = stateText;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (bgImg) createPixelatedBackground();
  if (silhouetteImg) processSilhouette();
}
