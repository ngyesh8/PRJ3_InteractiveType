/* This script was developed with the help of ChatGPT and is 
   in the experimental phase as I attempt to figure out how
   to have images snap into position
   
   The following prompts were used:
    - Drag images and get the pieces to snap together when they 
      are in the correct places. When all the pieces are 
      solved, they will move into position to show the phrase. 
      How do I get the snapping to work? This is what I have so 
      far.
   */

let images = [];
let pieces = [];
let groups = [];
let dragGroup = null;    // the group currently being dragged
let offsetX = 0;
let offsetY = 0;

const PIECE_SCALE = 0.5;


function preload() {
  for (let i = 1; i <= 14; i++) {
    images.push(loadImage(i + ".png"));
  }
}


class Piece {
  
  constructor(img, tx, ty) { 
  // tx, ty: changing later as final locations of pieces
    this.img = img;
    this.w = img.width * PIECE_SCALE;
    this.h = img.height * PIECE_SCALE;

    this.x = random(0, width  - this.w);
    this.y = random(0, height - this.h);

    this.tx = tx;   // to find the final position (x)
    this.ty = ty;   // to find the final position (y)

    this.group = null;  // not assigned yet

    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.3, 0.3);
  }

  display() {
    imageMode(CENTER);
    image(this.img, this.x, this.y, this.w, this.h);
  }

  isMouseOver() {
    return mouseX > this.x && mouseX < this.x + this.w &&
           mouseY > this.y && mouseY < this.y + this.h;
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
    let minX = min(this.members.map(p => p.x));
    let minY = min(this.members.map(p => p.y));
    let maxX = max(this.members.map(p => p.x + p.w));
    let maxY = max(this.members.map(p => p.y + p.h));
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

  absorb(other) {
    for (let p of other.members) {
      p.group = this;
      this.members.push(p);
    }
    
    groups = groups.filter(g => g !== other);
  }

 // check if positioning is correct
  isSolved() {
    return this.members.length === pieces.length &&
           this.members.every(p => {
             return abs(p.x - p.tx) < 2 && abs(p.y - p.ty) < 2;
           });
  }
}


function setup() {
  createCanvas(windowWidth, windowHeight);


  let targets = [
    {x: 400, y: 200},
    {x: 460, y: 200},
    {x: 520, y: 200},

    {x: 380, y: 300},
    {x: 440, y: 300},
    {x: 500, y: 300},
    {x: 560, y: 300},

    {x: 420, y: 400},
    {x: 480, y: 400},
    {x: 540, y: 400},

    {x: 450, y: 500},
    {x: 510, y: 500},
    {x: 570, y: 500},
    {x: 630, y: 500}
  ];

  for (let i = 0; i < images.length; i++) {
    let p = new Piece(images[i], targets[i].x, targets[i].y);
    pieces.push(p);
    let g = new Group(p);
    groups.push(g);
  }
}


function draw() {
  background("#387AFF");

  for (let i = 0; i < groups.length; i++) {
    let g = groups[i];
    g.update();
    g.display();
  }
}


function mousePressed() {
  for (let i = pieces.length - 1; i >= 0; i--) {
    let p = pieces[i];
    if (!p.group.solved && p.isMouseOver()) {
      dragGroup = p.group;
      offsetX = mouseX - p.group.anchorX;
      offsetY = mouseY - p.group.anchorY;
      break;
    }
  }
}

function mouseDragged() {
  if (dragGroup) {
    dragGroup.moveTo(mouseX - offsetX, mouseY - offsetY);
  }
}

