import moment from 'moment';
import Vector from './Vector';
import starsUrl from '../img/stars-background.jpg';

const MIN_ZOOM_LEVEL = 10;
const MAX_ZOOM_LEVEL = 1000;
const DEFAULT_ZOOM = 250;
const PLANET_COLOURS = {
  "mercury": "silver",
  "mars": "red",
  "earth": "skyblue",
  "venus": "green",
  "sun": "yellow",
  "jupiter": "orange",
  "saturn": "tan",
  "uranus": "skyblue",
  "neptune": "lightblue",
  "pluto": "silver"
};

const PLANET_SIZES = {
  "mercury": 2.5,
  "venus": 6,
  "earth": 6.3,
  "pluto": 6,
  "mars": 3.5,
  "jupiter": 10,
  "uranus": 7,
  "neptune": 7,
  "saturn": 8,
  "sun": 15,
}

function CanvasRenderer(container) {

  let document = container.getRootNode();
  let canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 680;
  container.appendChild(canvas);

  this.canvas = canvas;
  this.ctx = this.canvas.getContext("2d");

  this.backgroundImage = document.createElement("img");

  this.zoom = DEFAULT_ZOOM;
  this.viewDeltaX = 0;
  this.viewDeltaY = 0;

  let scope = this;

  var keyCodes = {
    99: function (event) {
      scope.recenter();
    }
  };

  container.addEventListener("keypress", function (event) {
    if (event.type === "keypress" && keyCodes.hasOwnProperty(event.keyCode)) {
      keyCodes[event.keyCode](event);
      event.preventDefault();
    }
  });

  container.addEventListener("wheel", function (event) {
    event.preventDefault();
    if (event.deltaY > 0) {
      scope.zoomOut();
    } else if (event.deltaY < 0) {
      scope.zoomIn(event.clientX, event.clientY);
    }
  });

  container.addEventListener("mousedown", function (event) {
    if (!container.contains(event.target)) {
      return;
    }

    event.preventDefault();
    if (event.buttons === 1) {

      let pan = (function () {
        let screenX = event.screenX,
          screenY = event.screenY;

        return function (e) {
          deltaX = e.screenX - screenX;
          deltaY = screenY - e.screenY;

          screenX = e.screenX;
          screenY = e.screenY;

          scope.moveViewBy(deltaX, deltaY);
        }
      })();

      function removePan(e) {
        removeEventListener("mousemove", pan);
        removeEventListener("mouseup", removePan);
      };

      addEventListener("mousemove", pan);
      addEventListener("mouseup", removePan);
    }
  })
};

CanvasRenderer.prototype._drawBody = function (planet) {
  let ctx = this.ctx;
  let canvas = this.canvas;

  ctx.beginPath();
  ctx.fillStyle = PLANET_COLOURS[planet.name];
  ctx.arc(planet.derived.position.x, planet.derived.position.y, PLANET_SIZES[planet.name] / this.zoom, 0, 2 * Math.PI);
  ctx.fill();

  if (planet.name !== "sun") {
    // Calculate elliptical plot
    let rotationPoint;
    if (planet.derived.apoapsis.x >= 0) {
      rotationPoint = planet.derived.apoapsis;
    } else {
      rotationPoint = planet.derived.periapsis;
    }

    let rotationAngle = Math.atan((rotationPoint.y - planet.derived.center.y) / (rotationPoint.x - planet.derived.center.x));

    ctx.beginPath();
    ctx.strokeStyle = PLANET_COLOURS[planet.name];
    ctx.lineWidth = 0.5 / this.zoom;
    ctx.ellipse(
      planet.derived.center.x,
      planet.derived.center.y,
      planet.derived.semiMajorAxis,
      planet.derived.semiMinorAxis,
      rotationAngle, 0, 2 * Math.PI);
    ctx.stroke();

    // Periapsis
    ctx.beginPath();
    ctx.fillStyle = 'purple';
    ctx.arc(planet.derived.periapsis.x, planet.derived.periapsis.y, 3 / this.zoom, 0, 2 * Math.PI);
    ctx.fill();

    // Apoapsis
    ctx.beginPath();
    ctx.fillStyle = 'aqua';
    ctx.arc(planet.derived.apoapsis.x, planet.derived.apoapsis.y, 3 / this.zoom, 0, 2 * Math.PI);
    ctx.fill();
  }
}

CanvasRenderer.prototype._drawHUD = function (simulation) {

  let ctx = this.ctx;
  let canvas = this.canvas;

  // Draw current date
  ctx.font = '18px sans-serif';
  ctx.fillStyle = "silver";
  ctx.fillText(`Date: ${moment(simulation.time).format()}`, 10, 30);

  // Draw warp fields
  let xOffset = 10;
  let yOffset = canvas.height - 20;
  for (let i = 0; i < simulation.timeWarpValues.length; i++) {
    ctx.beginPath();
    ctx.moveTo(xOffset, yOffset - 10);
    ctx.lineTo(xOffset, yOffset + 10);
    ctx.lineTo(xOffset + 17.321, yOffset);
    ctx.closePath();
    if (i <= simulation.timeWarpIdx) {
      ctx.fillStyle = "green";
      ctx.fill();
    }

    ctx.strokeStyle = "silver";
    ctx.stroke();

    xOffset += 20;
  }
};

CanvasRenderer.prototype.zoomIn = function (x, y) {
  this.zoom = Math.min(this.zoom + 15, MAX_ZOOM_LEVEL);
};

CanvasRenderer.prototype.zoomOut = function (x, y) {
  this.zoom = Math.max(this.zoom - 15, MIN_ZOOM_LEVEL);
};

CanvasRenderer.prototype.recenter = function () {
  this.viewDeltaX = 0;
  this.viewDeltaY = 0;
  this.zoom = DEFAULT_ZOOM;
};

CanvasRenderer.prototype.moveViewBy = function (deltaX, deltaY) {
  this.viewDeltaX += deltaX;
  this.viewDeltaY += deltaY;
};

CanvasRenderer.prototype.initialize = function (solarSystem) {
  // Load the stars background image in the background
  // (asynchronous, notify when we are done)
  return new Promise((resolve, reject) => {
    this.backgroundImage.onload = function () {
      resolve();
    };
    this.backgroundImage.src = starsUrl;
  });
};

CanvasRenderer.prototype.render = function (simulation, solarSystem) {
  const ctx = this.ctx;
  const canvas = this.canvas;

  // Clear Canvas
  ctx.save();
  ctx.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);

  // Center the coordinate system in the middle
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI);
  ctx.translate(this.viewDeltaX, this.viewDeltaY);
  ctx.scale(this.zoom, this.zoom);

  // Draw the sun artificially at the center of the map
  this._drawBody({
    name: 'sun',
    derived: {
      position: new Vector(0, 0, 0)
    }
  })

  solarSystem.planets.forEach(function (planet) {
    this._drawBody(planet);
  }, this);

  ctx.restore();

  // Heads-up display elements (i.e., time, warp)
  this._drawHUD(simulation);

};

export default CanvasRenderer;
