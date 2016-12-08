const canvas = document.getElementById("expanse-simulation");
const ctx = canvas.getContext("2d");

function Vector(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
};

Vector.prototype.plus = function (other) {
  return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
};

Vector.prototype.times = function (factor) {
  return new Vector(this.x * factor, this.y * factor, this.z * factor);
};

Vector.prototype.magnitude = function (other) {
  if (!other) other = new Vector(0, 0, 0);

  return Math.sqrt(
    Math.pow(this.x - other.x, 2) +
    Math.pow(this.y - other.y, 2) +
    Math.pow(this.z - other.z, 2));
}

const BASE_TIME_SCALE = 86400;
let timeScale = 5;

function runAnimation(frameFunc) {
  var lastTime = null;

  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = (time - lastTime) / 1000 * BASE_TIME_SCALE * Math.pow(timeScale, 2);
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

ctx.scale(-1, 1);
ctx.translate(-canvas.width / 2, canvas.height / 2);
ctx.rotate(Math.PI);

const MIN_BODY_RADIUS = 5;
const MAX_BODY_RADIUS = 25;

function drawBody(body) {
  ctx.beginPath();

  let radius = body.primary ? body.mass / body.primary.mass * MAX_BODY_RADIUS : MAX_BODY_RADIUS;

  // Calculate unit vector
  let distance = body.position.magnitude();
  let position;

  if (distance == 0) {
    position = body.position;
  } else {

    // Scale to screen
    position = body.position.times(Math.min(canvas.height, canvas.width) / 5);

    // ctx.beginPath();
    // ctx.lineWidth = 0.5;
    // ctx.strokeStyle = 'black';
    // ctx.moveTo(0, 0);
    // ctx.lineTo(position.x, position.y);
    // ctx.stroke();
    //
    // ctx.beginPath();
    // ctx.arc(0, 0, position.magnitude(), 0, Math.PI * 2);
    // ctx.stroke();
  }

  ctx.beginPath();
  ctx.fillStyle = 'black';
  ctx.arc(position.x, position.y, Math.max(MIN_BODY_RADIUS, radius), 0, 2 * Math.PI);
  ctx.fill();
}

function Derivitives() {
  this.dx = new Vector(0, 0, 0);
  this.dp = new Vector(0, 0, 0);
};

function Body(mass, primary) {
  this.mass = mass;
  this.inverseMass = 1 / mass;
  this.primary = primary;
  this.position = new Vector(0, 0, 0);
  this.velocity = new Vector(0, 0, 0);
  this.momentum = new Vector(0, 0, 0);
};

Body.prototype.updateMomentum = function (momentum) {
  this.momentum = momentum;
  this.velocity = momentum.times(this.inverseMass);

  let u = UNIVERSAL_GRAVITY * this.primary.mass;

  //https://en.wikipedia.org/wiki/Orbital_eccentricity
  //https://en.wikipedia.org/wiki/Eccentricity_vector
  //e = |eccentricity_vector|

  let orbitalEnergy = Math.pow(this.velocity.magnitude(), 2) / 2 -
    (u / this.position.magnitude());

  //let specificRelativeAngularMomentum =

  this.semiMajorAxis = -u / (2 * orbitalEnergy);
  this.eccentricity = Math.sqrt(1 + (2 * orbitalEnergy * Math.pow(specificRelativeAngularMomentum, 2) / Math.pow(UNIVERSAL_GRAVITY * this.primary.mass, 2)))
}

function force(body, t) {
  let radius = Math.sqrt(
    Math.pow(body.position.x, 2) +
    Math.pow(body.position.y, 2) +
    Math.pow(body.position.z, 2));
  let unitVector = body.position.times(1 / radius);

  return unitVector.times(-UNIVERSAL_GRAVITY * body.mass * body.primary.mass / Math.pow(radius, 2));
}

function evaluate(body, t, dt, changes) {

  let updatedBody = new Body(body.mass, body.primary);
  updatedBody.position = body.position.plus(changes.dx.times(dt));
  updatedBody.updateMomentum(body.momentum.plus(changes.dp.times(dt)));

  //updatedBody.momentum = body.momentum.plus(changes.dp.times(dt));
  //updatedBody.velocity = updatedBody.momentum.times(updatedBody.inverseMass);

  let derivitives = new Derivitives();
  derivitives.dx = updatedBody.velocity;
  derivitives.dp = force(updatedBody, t + dt);
  return derivitives;
}

function integrate(body, t, dt) {

  let a, b, c, d;

  a = evaluate(body, t, 0, new Derivitives());
  b = evaluate(body, t, dt * 0.5, a);
  c = evaluate(body, t, dt * 0.5, b);
  d = evaluate(body, t, dt, c);

  let dxdt = (a.dx.plus(b.dx.plus(c.dx).times(2.0)).plus(d.dx)).times(1.0 / 6.0);
  let dpdt = (a.dp.plus(b.dp.plus(c.dp).times(2.0)).plus(d.dp)).times(1.0 / 6.0);

  body.position = body.position.plus(dxdt.times(dt));
  body.updateMomentum(body.momentum.plus(dpdt.times(dt)));

  //body.momentum = body.momentum.plus(dpdt.times(dt));
  //body.velocity = body.momentum.times(body.inverseMass);
};

// Scale all constants by the AU (~approx distance from sun to earth)

const AU = 149597870700.0; // m
const SUN_MASS = 1.989e30 / AU; // kg
const EARTH_MASS = 5.97e14 / AU; // kg
const EARTH_TO_SUN = 149.6e9 / AU; // m
const UNIVERSAL_GRAVITY = 6.674e-11 / Math.pow(AU, 2); // N⋅m^2/kg^2

let primary = new Body(SUN_MASS);
let secondary = new Body(EARTH_MASS, primary);

// Initial Conditions
secondary.position = new Vector(0, EARTH_TO_SUN, 0);
secondary.velocity = new Vector(-Math.sqrt(UNIVERSAL_GRAVITY * (SUN_MASS + EARTH_MASS) / EARTH_TO_SUN), 0, 0).times(1.11);
secondary.momentum = secondary.velocity.times(secondary.mass);
secondary.updateMomentum(secondary.momentum);

let last = 0;
let numTimes = 0;
let numToRun = 10000;
runAnimation(function (step) {

  if (numTimes < 5) {
    console.log(`${secondary.position.x}, ${secondary.position.y}`);
  }

  // update physics
  integrate(secondary, last, step);

  // Clear Canvas
  ctx.fillStyle = 'gray';
  ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

  drawBody(primary);
  drawBody(secondary);

  last += step;
  numTimes++;
  if (numTimes >= numToRun) {
    console.log('All done!');
    return false;
  }
});

document.querySelector("[name=timeScale]").addEventListener('change', function (event) {
  timeScale = event.target.value / 10;
});
