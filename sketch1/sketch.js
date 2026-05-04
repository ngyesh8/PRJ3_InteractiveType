/* This script was developed with the help of Claude
   
   The following prompts were used:
   
  - How to get the pieces to snap together when they are
  dragged on top of the a piece in their corresponding group
  - Help me figure out the coordinates of the images based on
    my attached initial sketch.
  – How to vertify that all pieces have been grouped?
    Move them into the correct positions.
   */

let images = [];
let txt;
let pieces = [];
let groups = [];
let dragGroup = null;    // the group currently being dragged
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let puzzleComplete = false;

const PIECE_SCALE = 0.5;
const SNAP_DIST = 60;  // how close neccessary to snap (pixels)


function preload() {
  for (let i = 1; i <= 14; i++) {
    images.push(loadImage("sketch1/" + i + ".png"));
  }
  txt = loadFont("sketch1/SNPro-VariableFont_wght.ttf");
}


class Piece {
  
  constructor(img, tx, ty) { 
  // tx, ty: home position (centre) — where this piece lives in the final arrangement
    this.img = img;
    this.w = img.width * PIECE_SCALE;
    this.h = img.height * PIECE_SCALE;

    // Start at the home position; setup() will scatter them after
    this.x = tx;
    this.y = ty;

    this.tx = tx;   // final position x (centre)
    this.ty = ty;   // final position y (centre)

    this.group = null;  // not assigned yet

    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.3, 0.3);
  }

  display() {
    imageMode(CENTER);
    image(this.img, this.x, this.y, this.w, this.h);
  }

  isMouseOver() {
  return (
    mouseX > this.x - this.w / 2 &&
    mouseX < this.x + this.w / 2 &&
    mouseY > this.y - this.h / 2 &&
    mouseY < this.y + this.h / 2
    );
  }
}


class Group {
  constructor(piece) {
    this.members = [piece];
    piece.group = this;
    this.solved = false;

    // Floating velocity for the whole group
    this.vx = piece.vx;
    this.vy = piece.vy;
  }


  get anchorX() { return this.members[0].x; }
  get anchorY() { return this.members[0].y; }


  moveTo(ax, ay) {
    let dx = ax - this.members[0].x;
    let dy = ay - this.members[0].y;
    for (let p of this.members) {
      p.x += dx;
      p.y += dy;
    }
  }

  update() {
    if (this.solved || dragGroup === this) return;

    let ax = this.members[0].x + this.vx;
    let ay = this.members[0].y + this.vy;

    this.vx += random(-0.02, 0.02);
    this.vy += random(-0.02, 0.02);
    this.vx = constrain(this.vx, -0.5, 0.5);
    this.vy = constrain(this.vy, -0.5, 0.5);

    // Bounce
    let minX = min(this.members.map(p => p.x - p.w / 2));
    let minY = min(this.members.map(p => p.y - p.h / 2));
    let maxX = max(this.members.map(p => p.x + p.w / 2));
    let maxY = max(this.members.map(p => p.y + p.h / 2));
    let gw = maxX - minX;
    let gh = maxY - minY;

    // Offset from anchor to group top-left
    let ox = minX - this.members[0].x;
    let oy = minY - this.members[0].y;

    if (ax + ox < 0) { 
      ax = -ox;
      this.vx =  abs(this.vx); 
    }
    if (ax + ox + gw > width) {
      ax = width - gw - ox;
      this.vx = -abs(this.vx);
    }
    if (ay + oy < 0) {
      ay = -oy;
      this.vy =  abs(this.vy);
    }
    if (ay + oy + gh > height) {
      ay = height - gh - oy;
      this.vy = -abs(this.vy);
    }

    this.moveTo(ax, ay);
  }

  display() {
    for (let p of this.members) {
      p.display();
    }
  }

  // Absorb another group. Incoming pieces are placed using their tx/ty offsets
  // relative to this group's anchor, so they land in the correct relative positions.
  absorb(other) {
    let anchor = this.members[0];
    for (let p of other.members) {
      // Place p at: anchor's current position + (p's home offset from anchor's home)
      p.x = anchor.x + (p.tx - anchor.tx);
      p.y = anchor.y + (p.ty - anchor.ty);
      p.group = this;
      this.members.push(p);
    }
    groups = groups.filter(g => g !== other);
  }
}


function setup() {
  createCanvas(1100, 620);

  // tx, ty = home centre positions, matching the start_finish.png arrangement.
  // ─────────────────────────────────────────────────────────────────────────
  // 萬 (pieces 1–3)
  // 事 (pieces 4–7)
  // 如 (pieces 8–10)
  // 意 (pieces 11–14)
  //
  // To reposition a piece, change its {x, y} below.
  // Coordinates are the centre of the piece on the 1100×620 canvas.
  // ─────────────────────────────────────────────────────────────────────────
  let targets = [
    // 萬
    {x: 347, y: 218},  // 1.png 
    {x: 317, y: 287},  // 2.png 
    {x: 382, y: 279},  // 3.png 

    // 事
    {x: 453, y: 268},  // 4.png 
    {x: 510, y: 270},  // 5.png 
    {x: 469, y: 331},  // 6.png 
    {x: 508, y: 322},  // 7.png 

    // 如
    {x: 587, y: 225},  // 8.png 
    {x: 576, y: 274},  // 9.png 
    {x: 624, y: 271},  // 10.png 

    // 意
    {x: 719, y: 217},  // 11.png 
    {x: 786, y: 222},  // 12.png 
    {x: 733, y: 277},  // 13.png 
    {x: 777, y: 267},  // 14.png
  ];

  // Which pieces belong together (0-indexed). Used for snapping.
  // Group 0=萬, 1=事, 2=如, 3=意
  let groupIds = [0, 0, 0,  1, 1, 1, 1,  2, 2, 2,  3, 3, 3, 3];

  for (let i = 0; i < images.length; i++) {
    let p = new Piece(images[i], targets[i].x, targets[i].y);
    p.groupId = groupIds[i];  // which character this piece belongs to
    pieces.push(p);
    let g = new Group(p);
    groups.push(g);
  }

  // Scatter all pieces to random positions
  for (let p of pieces) {
    p.x = random(p.w / 2, width  - p.w / 2);
    p.y = random(p.h / 2, height - p.h / 2);
  }
}


function draw() {
  background("#387AFF");

  // Check completion ONCE
  if (!puzzleComplete && isPuzzleComplete()) {
    puzzleComplete = true;

    // stop all floating motion immediately
    for (let g of groups) {
      g.vx = 0;
      g.vy = 0;
    }
  }

  for (let g of groups) {

    // Only float if not complete
    if (!puzzleComplete) {
      g.update();
    }

    // After completion, move pieces to final positions
    if (puzzleComplete) {
      let allSnapped = true;

      for (let p of g.members) {
        p.x = lerp(p.x, p.tx, 0.1);
        p.y = lerp(p.y, p.ty, 0.1);

        if (dist(p.x, p.y, p.tx, p.ty) > 0.5) {
          allSnapped = false;
        } else {
          // snap exactly to avoid jitter
          p.x = p.tx;
          p.y = p.ty;
        }
      }

      // once a group is fully in place, freeze it permanently
      if (allSnapped) {
        g.solved = true;
      }
    }

    g.display();
  }
  // print text when completed
  if (puzzleComplete) {
      fill(255);
      noStroke();
      textAlign(CENTER);
      textSize(30);
      textFont(txt);
      text("may everything go your way", width / 2, height /1.35);
      }
}


function mousePressed() {
  dragging = false;
  dragGroup = null;

  for (let i = pieces.length - 1; i >= 0; i--) {
    let p = pieces[i];

    if (p.isMouseOver()) {
      dragGroup = p.group;

      offsetX = mouseX - dragGroup.anchorX;
      offsetY = mouseY - dragGroup.anchorY;

      dragging = true;

      // bring group to front
      groups = groups.filter(g => g !== dragGroup);
      groups.push(dragGroup);

      break;
    }
  }
}

function mouseDragged() {
  if (dragging && dragGroup) {
    dragGroup.moveTo(mouseX - offsetX, mouseY - offsetY);
  }
}

function mouseReleased() {
  if (!dragging || !dragGroup) {
    dragging = false;
    dragGroup = null;
    return;
  }

  // Check if the dropped group is close enough to snap with another group
  // of the same character.
  let dropped = dragGroup;
  dragging = false;
  dragGroup = null;

  // All pieces in the dropped group must share a groupId
  let gid = dropped.members[0].groupId;
  if (!dropped.members.every(p => p.groupId === gid)) return;

  // Find the nearest other group that contains pieces of the same character
  let best = null;
  let bestDist = Infinity;

  for (let g of groups) {
    if (g === dropped) continue;
    // Target group must also be a pure same-character group
    if (!g.members.every(p => p.groupId === gid)) continue;

    // Distance between the two groups' anchor pieces
    let d = dist(dropped.anchorX, dropped.anchorY, g.anchorX, g.anchorY);
    if (d < SNAP_DIST && d < bestDist) {
      best = g;
      bestDist = d;
    }
  }

  if (best) {
    best.absorb(dropped);
  }
}

function isPuzzleComplete() {
  // checks the expected size of character, aka. how many images are in the group that makes up a character 
  let expectedSizes = { // this is the "expected"
    0: 3, // 萬
    1: 4, // 事
    2: 3, // 如
    3: 4  // 意
  };

  for (let g of groups) { //loop compares if match /w expected
    let g_id = g.members[0].groupId;
    if (g.members.length !== expectedSizes[g_id]) {
      return false;
    }
  }
  // if pass
  return true;
  
}
