/* 
 * GLITCH IS SKIN - BACKUP (STABLE VERSION)
 * Saved on: Monday, March 16, 2026
 * 
 * This version includes:
 * - Robust Serial method-checking (readUntil/readString/readStringUntil)
 * - Performance optimization (pointDensity = 8)
 * - try/catch safety blocks to prevent silhouette disappearance
 * - 35s fast-scrolling large banner
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
      if (typeof serial.readUntil === 'function') {
        data = serial.readUntil('\n');
      } else if (typeof serial.readStringUntil === 'function') {
        data = serial.readStringUntil('\n');
      } else if (typeof serial.readString === 'function') {
        data = serial.readString();
      }

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
        }
      }
    }
  } catch (e) {
    console.warn("Serial data error:", e);
  }

  updateStatusUI();
  drawFrayingEdges();
  push();
  translate(width/2, height/2);
  if (currentStage !== RUPTURE_STAGES.IDLE) {
    handleRuptureLogic();
  } else {
    drawGhosts();
    drawMainAvatar();
  }
  pop();
  drawJoystickIndicator();
}

class Particle {
  constructor(x, y, imgW, imgH) {
    this.originX = x - imgW/2;
    this.originY = y - imgH/2;
    this.x = this.originX;
    this.y = this.originY;
    this.vx = 0;
    this.vy = 0;
    this.baseSize = random(1.5, 3);
    let c = random(180, 230);
    this.baseColor = color(c, c + random(-10, 10), c + random(10, 25));
  }
  update() {
    if (currentStage === RUPTURE_STAGES.BURST) {
      this.x += this.vx;
      this.y += this.vy;
      if (ruptureType === 0) this.vy += 0.2; 
      else { 
        this.vx += sin(frameCount * 0.1 + this.originX) * 0.1;
        this.vy *= 0.98;
      }
    } else if (currentStage === RUPTURE_STAGES.SETTLE) {
       if (ruptureType === 0) {
         this.y = min(this.y + 2, height/3 + random(10));
       }
    } else if (currentStage === RUPTURE_STAGES.REBIRTH) {
      this.x = lerp(this.x, this.originX, 0.05);
      this.y = lerp(this.y, this.originY, 0.05);
    }
  }
  display(offsetX = 0, offsetY = 0, alpha = 255, isGhost = false) {
    let px = this.x + offsetX;
    let py = this.y + offsetY;
    if (!isGhost && glitchIntensity > 0.2) {
      if (random() < glitchIntensity * 0.1) {
        px += random(-20, 20) * glitchIntensity;
        py += random(-5, 5) * glitchIntensity;
      }
    }
    push();
    strokeWeight(this.baseSize);
    if (!isGhost && glitchIntensity > 0.6 && random() < 0.3) {
      stroke(255, 0, 50, alpha * 0.5); 
      point(px + 5 * glitchIntensity, py);
      stroke(0, 255, 255, alpha * 0.5);
      point(px - 5 * glitchIntensity, py);
    }
    let c = this.baseColor;
    if (!isGhost && glitchIntensity > 0.8 && random() < 0.05) {
      stroke(255, 200, 50, alpha); 
    } else {
      stroke(red(c), green(c), blue(c), alpha);
    }
    point(px, py);
    pop();
  }
}

function drawMainAvatar() {
  for (let p of particles) {
    p.update();
    p.display();
  }
  if (glitchIntensity > 0.4) {
    stroke(255, 255, 255, 20 * glitchIntensity);
    for(let i = -height/2; i < height/2; i += 10) {
       if (random() < 0.1 * glitchIntensity) {
         line(-width/2, i + random(-2, 2), width/2, i + random(-2, 2));
       }
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
    for (let p of particles) {
      if (random() < 0.15) { 
        p.display(offX, offY, alpha, true);
      }
    }
  }
}

function initiateRupture() {
  currentStage = RUPTURE_STAGES.BURST;
  ruptureTimer = millis();
  ruptureType = (ruptureType + 1) % 2; 
  for (let p of particles) {
    if (ruptureType === 0) { 
      p.vx = random(-2, 2);
      p.vy = random(-2, 5);
    } else { 
      let ang = random(TWO_PI);
      let mag = random(5, 15);
      p.vx = cos(ang) * mag;
      p.vy = sin(ang) * mag - 5;
    }
  }
}

function handleRuptureLogic() {
  let elapsed = millis() - ruptureTimer;
  if (currentStage === RUPTURE_STAGES.BURST && elapsed > 1500) {
    currentStage = RUPTURE_STAGES.SETTLE;
  } else if (currentStage === RUPTURE_STAGES.SETTLE && elapsed > 3500) {
    currentStage = RUPTURE_STAGES.REBIRTH;
  } else if (currentStage === RUPTURE_STAGES.REBIRTH && elapsed > 6000) {
    currentStage = RUPTURE_STAGES.IDLE;
  }
  for (let p of particles) {
    p.update();
    p.display();
  }
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
  noFill();
  stroke(255, 50);
  ellipse(0, 0, 40, 40);
  fill(255, 150);
  noStroke();
  ellipse(normX * 15, normY * 15, 8, 8);
  pop();
}

function updateStatusUI() {
  document.getElementById('stat-image').innerText = imgStatus;
  document.getElementById('stat-joy').innerText = `${joyX}, ${joyY}`;
  let isOpened = serial.opened();
  document.getElementById('stat-serial').innerText = isOpened ? "CONNECTED" : "IDLE";
  if (isOpened) {
    document.getElementById('ui-overlay').style.display = 'none';
  }
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
