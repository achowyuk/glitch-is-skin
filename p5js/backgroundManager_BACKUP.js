/**
 * Background Manager - BACKUP (DYNAMIC BG & SKIN-TO-BLACK)
 * Saved on: Monday, March 16, 2026
 */

class BackgroundManager {
  constructor() {
    this.bgNames = [
      'arch.jpg', 'blue.jpeg', 'chair.jpg', 'computer.jpg', 'cracks.jpg',
      'digi.jpg', 'eye.jpg', 'father.jpg', 'float.jpg', 'flower.jpg',
      'foot.jpg', 'glisten.jpg', 'grass.jpg', 'hands.jpg', 'isolation.jpg',
      'kayak.jpg', 'laid.jpg', 'layer.jpg', 'leaves.jpg', 'legs.jpg',
      'lily.jpg', 'maze.jpg', 'mounds.jpg', 'nap.jpg', 'office.jpg',
      'path.jpg', 'play.jpg', 'pool.jpg', 'red-mound.jpg', 'red.jpg',
      'skateboard.jpg', 'sky.jpg', 'sofa.jpg', 'stair.jpg', 'staircases.jpg',
      'sunflower.jpg', 'swan.jpg', 'tree.jpg', 'washer.jpg', 'woman.jpg'
    ];
    this.currentIndex = 0;
    this.currentImg = null;
    this.pixelatedBg = null;
    this.isProcessing = false;
  }

  async next() {
    if (this.isProcessing) return;
    this.currentIndex = (this.currentIndex + 1) % this.bgNames.length;
    await this.loadAndProcess();
  }

  async loadAndProcess() {
    this.isProcessing = true;
    let name = this.bgNames[this.currentIndex];
    return new Promise((resolve) => {
      loadImage('assets/' + name, (img) => {
        this.processImage(img);
        this.isProcessing = false;
        resolve();
      }, () => {
        console.warn("Failed to load background:", name);
        this.isProcessing = false;
        resolve();
      });
    });
  }

  processImage(img) {
    let scale = 0.2; 
    let w = floor(img.width * scale);
    let h = floor(img.height * scale);
    let pg = createGraphics(w, h);
    pg.image(img, 0, 0, w, h);
    pg.loadPixels();
    for (let i = 0; i < pg.pixels.length; i += 4) {
      let r = pg.pixels[i];
      let g = pg.pixels[i + 1];
      let b = pg.pixels[i + 2];
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && abs(r - g) > 10) {
         pg.pixels[i] = 0; pg.pixels[i + 1] = 0; pg.pixels[i + 2] = 0;
      } else {
        let avg = (r + g + b) / 3;
        pg.pixels[i] = lerp(r, avg, 0.3);
        pg.pixels[i + 1] = lerp(g, avg, 0.2);
        pg.pixels[i + 2] = lerp(b, avg, 0.4);
      }
    }
    pg.updatePixels();
    let finalW = ceil(windowWidth / 6);
    let finalH = ceil(windowHeight / 6);
    this.pixelatedBg = createGraphics(finalW, finalH);
    this.pixelatedBg.noSmooth();
    this.pixelatedBg.image(pg, 0, 0, finalW, finalH);
  }

  display() {
    if (this.pixelatedBg) {
      push(); noSmooth(); image(this.pixelatedBg, 0, 0, width, height);
      fill(13, 13, 18, 180); rect(0, 0, width, height); pop();
    } else { background(13, 13, 18); }
  }
}
