/* This script was developed with the help of Claude
   
   The following prompts were used:
   
  - how to make a paint brush that functions like a spray can?
  – how do i make the paint disappear when switching between phases?
  - how to make a pill button?
   */
const PHRASES = [
  { src: '1.png', label: 'you got this!' },
  { src: '2.png', label: 'we believe in you!' },
  { src: '3.png', label: 'may your wishes come true' },
  { src: '4.png', label: 'come & go safely' },
  { src: '5.png', label: 'wishing you prosperity' },
  { src: '6.png', label: 'good luck' },
];

const COLORS = [
  '#FF6B6B','#FF9A3C','#FFD93D','#FFF3B0','#6BCB77',
  '#4ECDC4','#4361EE','#C77DFF','#F72585','#A8DADC',
  '#FFB4A2','#B7E4C7','#BDE0FE','#FFC8DD','#CAFFBF',
];

const BRUSH_RADIUS = 30;
const BRUSH_DENSITY = 25;
const MASK_W = 240;
const MASK_H = 135;

let imgs = [];           
let masks = [];          // Uint8Array masks (MASK_W × MASK_H): 1=paintable, 0=blocked
let paintLayer;          
let currentIdx = 5;      
let currentColor;
let font;
let buttons = [];


function preload() {
  font = loadFont('SNPro-Regular.ttf');
  for (let i = 0; i < PHRASES.length; i++) {
    imgs[i] = loadImage(PHRASES[i].src);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  pixelDensity(1);

  currentColor = color(COLORS[0]);

  // paint layer — drawn behind the phrase overlay
  paintLayer = createGraphics(width, height);
  paintLayer.pixelDensity(1);
  paintLayer.background(255);

  for (let i = 0; i < imgs.length; i++) {
    masks[i] = buildMask(imgs[i]);
  }

  buildButtons();
  noCursor();
}

function draw() {
  background("#f0ede8");

  // paint layer behind overlay
  image(paintLayer, 0, 0, width, height);

  // phrase overlay on top of paint
  image(imgs[currentIdx], 0, 0, width, height);

  // spray while mouse held
  if (mouseIsPressed && mouseButton === LEFT) {
    spray(mouseX, mouseY);
  }

  drawUI();
  drawCursorRing();
}

function buildMask(img) {
  const W = img.width;
  const H = img.height;

  img.loadPixels();


  let rmin = H, rmax = 0, cmin = W, cmax = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (img.pixels[(y * W + x) * 4 + 3] === 0) {
        if (y < rmin) rmin = y;
        if (y > rmax) rmax = y;
        if (x < cmin) cmin = x;
        if (x > cmax) cmax = x;
      }
    }
  }
  const pad = 30;
  rmin = max(0, rmin - pad);
  rmax = min(H - 1, rmax + pad);
  cmin = max(0, cmin - pad);
  cmax = min(W - 1, cmax + pad);

  const arr = new Uint8Array(MASK_W * MASK_H);
  for (let row = 0; row < MASK_H; row++) {
    for (let col = 0; col < MASK_W; col++) {
      const srcX   = round((col / MASK_W) * (W - 1));
      const srcY   = round((row / MASK_H) * (H - 1));
      const alpha  = img.pixels[(srcY * W + srcX) * 4 + 3];
      const inBbox = srcX >= cmin && srcX <= cmax && srcY >= rmin && srcY <= rmax;
      arr[row * MASK_W + col] = (alpha === 0 && inBbox) ? 1 : 0;
    }
  }
  return arr;
}

// hitbox testing
function isPaintable(cx, cy) {
  const arr = masks[currentIdx];
  if (!arr) return false;
  const col = round((cx / width)  * (MASK_W - 1));
  const row = round((cy / height) * (MASK_H - 1));
  if (col < 0 || row < 0 || col >= MASK_W || row >= MASK_H) return false;
  return arr[row * MASK_W + col] === 1;
}

// spray paint
function spray(x, y) {
  paintLayer.noStroke();
  paintLayer.fill(currentColor);
  for (let i = 0; i < BRUSH_DENSITY * 2; i++) {
    const angle = random(TWO_PI);
    const dist  = sqrt(random()) * BRUSH_RADIUS;
    const px = x + cos(angle) * dist;
    const py = y + sin(angle) * dist;
    if (!isPaintable(px, py)) continue;
    const dotSize = random(1, 3.5);
    paintLayer.circle(px, py, dotSize * 2);
  }
}

// cursor design
function drawCursorRing() {
  noFill();
  stroke(currentColor);
  strokeWeight(2);
  setLineDash([4, 3]);
  circle(mouseX, mouseY, BRUSH_RADIUS * 2);
  setLineDash([]);
  fill(currentColor);
  noStroke();
  circle(mouseX, mouseY, 6);
}

// p5 has no built-in setLineDash — reach into the underlying context
function setLineDash(pattern) {
  drawingContext.setLineDash(pattern);
}

// buttons

const BTN_H    = 36;
const BTN_PAD  = 12;
const BTN_GAP  = 8;
const UI_H     = 60;

function buildButtons() {
  // measure label widths and store button rects
  textSize(13);
  buttons = [];
  let x = 20;
  const y = height - UI_H + (UI_H - BTN_H) / 2;

  for (let i = 0; i < PHRASES.length; i++) {
    const w = textWidth(PHRASES[i].label) + BTN_PAD * 2;
    buttons.push({ i, x, y, w, h: BTN_H });
    x += w + BTN_GAP;
  }
}

function drawUI() {
  // Bar background
  noStroke();
  fill("#F2F2FA");
  rect(0, height - UI_H, width, UI_H);

  // Top border
  stroke(220, 220, 232);
  strokeWeight(1);
  line(0, height - UI_H, width, height - UI_H);

  // Phrase buttons
  textSize(13);
  textAlign(CENTER, CENTER);
  for (const btn of buttons) {
    const active = btn.i === currentIdx;
    if (active) {
      noFill();
      stroke(124, 92, 191); // purple
      strokeWeight(2);
    } else {
      fill(255);
      stroke(26, 26, 26);
      strokeWeight(2);
    }
    rect(btn.x, btn.y, btn.w, btn.h, btn.h / 2); // pill shape
    fill(active ? color(124, 92, 191) : color(26, 26, 26));
    noStroke();
    text(PHRASES[btn.i].label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  // hint text
  fill(136);
  noStroke();
  textSize(12);
  textStyle(ITALIC);
  textAlign(RIGHT, CENTER);
  text('press space to change color', width - 20, height - UI_H / 2);
  textStyle(NORMAL);
}

function mousePressed() {
  // Check button clicks
  for (const btn of buttons) {
    if (mouseX >= btn.x && mouseX <= btn.x + btn.w &&
        mouseY >= btn.y && mouseY <= btn.y + btn.h) {
      currentIdx = btn.i;
      paintLayer.background(255); // clear canvas on phrase switch
      return false;
    }
  }
}

function keyPressed() {
  if (key === ' ') {
    const last = COLORS.indexOf('#' + hex(red(currentColor), 2) + hex(green(currentColor), 2) + hex(blue(currentColor), 2));
    let next;
    do { next = floor(random(COLORS.length)); } while (next === last);
    currentColor = color(COLORS[next]);
    return false; // prevent page scroll
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Resize paint layer — note: this clears it; resize events are rare
  const old = paintLayer.get();
  paintLayer.resizeCanvas(width, height);
  paintLayer.background(255);
  paintLayer.image(old, 0, 0, width, height);
  buildButtons();
}
