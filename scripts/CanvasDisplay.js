const MIN_ZOOM_LEVEL = 25;
const MAX_ZOOM_LEVEL = 1000;
const DEFAULT_ZOOM = 250;
const TIME_WARP_VALUES = [1, 5, 10, 50, 100, 10e2, 10e3, 10e4, 10e5, 10e6];
let numToRun = 10000;

const PLANET_COLOURS = {
  "mercury": "silver",
  "mars": "red",
  "earth": "skyblue",
  "venus": "green",
  "sun": "yellow",
  "jupiter": "orange"
};

const PLANET_SIZES = {
  "mercury": 2.5,
  "venus": 6,
  "earth": 6.3,
  "mars": 3.5,
  "jupiter": 10,
  "saturn": 8,
  "sun": 15,
}

define(["moment"], function (moment) {

  function CanvasDisplay(canvas, solarSystem, backgroundImage) {
    this.solarSystem = solarSystem;
    this.backgroundImage = backgroundImage;

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.time = Date.now();
    this.timeWarpIdx = 6;
    this.zoom = DEFAULT_ZOOM;
    this.viewDeltaX = 0;
    this.viewDeltaY = 0;
  };

  CanvasDisplay.prototype._runAnimation = function (frameFunc) {
    var lastTime = null;

    function frame(time) {
      var stop = false;
      if (lastTime != null) {
        var timeStep = (time - lastTime);
        stop = frameFunc(timeStep) === false;
      }
      lastTime = time;
      if (!stop)
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  CanvasDisplay.prototype._drawBody = function (planet) {
    let ctx = this.ctx;
    let canvas = this.canvas;

    // Calculate elliptical plot
    if (planet.center) {
      ctx.beginPath();
      ctx.strokeStyle = PLANET_COLOURS[planet.name];
      ctx.lineWidth = 0.5 / this.zoom;
      ctx.ellipse(
        planet.center.x,
        planet.center.y,
        planet.semiMajorAxis,
        planet.semiMinorAxis, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.fillStyle = PLANET_COLOURS[planet.name];
    ctx.arc(planet.position.x, planet.position.y, PLANET_SIZES[planet.name] / this.zoom, 0, 2 * Math.PI);
    ctx.fill();

    if (planet.periapsis) {
      let periapsis = planet.periapsis.position;
      ctx.beginPath();
      ctx.fillStyle = 'aqua';
      ctx.arc(periapsis.x, periapsis.y, 3 / this.zoom, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (planet.apoapsis) {
      let apoapsis = planet.apoapsis.position;
      ctx.beginPath();
      ctx.fillStyle = 'aqua';
      ctx.arc(apoapsis.x, apoapsis.y, 3 / this.zoom, 0, 2 * Math.PI);
      ctx.fill();
    };
  }

  CanvasDisplay.prototype._drawHUD = function () {

    let ctx = this.ctx;
    let canvas = this.canvas;

    // Draw current date
    ctx.font = '18px sans-serif';
    ctx.fillStyle = "silver";
    ctx.fillText(`Date: ${moment(solarSystem.lastTime).format()}`, 10, 30);

    // Draw warp fields
    let xOffset = 10;
    let yOffset = canvas.height - 20;
    for (let i = 0; i < TIME_WARP_VALUES.length; i++) {
      ctx.beginPath();
      ctx.moveTo(xOffset, yOffset - 10);
      ctx.lineTo(xOffset, yOffset + 10);
      ctx.lineTo(xOffset + 17.321, yOffset);
      ctx.closePath();
      if (i <= this.timeWarpIdx) {
        ctx.fillStyle = "green";
        ctx.fill();
      }

      ctx.strokeStyle = "silver";
      ctx.stroke();

      xOffset += 20;
    }
  };

  CanvasDisplay.prototype.speedUp = function () {
    this.timeWarpIdx = Math.min(TIME_WARP_VALUES.length - 1, this.timeWarpIdx + 1);
  };

  CanvasDisplay.prototype.slowDown = function () {
    this.timeWarpIdx = Math.max(0, this.timeWarpIdx - 1);
  };

  CanvasDisplay.prototype.pause = function () {
    this.isStopped = true;
  };

  CanvasDisplay.prototype.zoomIn = function (x, y) {
    this.zoom = Math.min(this.zoom + 25, MAX_ZOOM_LEVEL);
  };

  CanvasDisplay.prototype.zoomOut = function (x, y) {
    this.zoom = Math.max(this.zoom - 25, MIN_ZOOM_LEVEL);
  };

  CanvasDisplay.prototype.recenter = function () {
    this.viewDeltaX = 0;
    this.viewDeltaY = 0;
    this.zoom = DEFAULT_ZOOM;
  };

  CanvasDisplay.prototype.moveViewBy = function (deltaX, deltaY) {
    this.viewDeltaX += deltaX;
    this.viewDeltaY += deltaY;

    console.log(this.viewDeltaX);
    console.log(this.viewDeltaY);
  };

  CanvasDisplay.prototype.run = function () {
    this.isStopped = false;

    let numTimes = 0;
    let solarSystem = this.solarSystem;
    let ctx = this.ctx;
    let canvas = this.canvas;

    this._runAnimation(function (dt) {

      if (this.isStopped) {
        return false;
      }

      let t = this.time;
      let timeScale = TIME_WARP_VALUES[this.timeWarpIdx];
      dt *= timeScale;

      // Update physics
      solarSystem.update(t, dt);

      // Clear Canvas
      //ctx.fillStyle = 'gray';
      //ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.backgroundImage, 0, 0, canvas.width,  canvas.height);
      ctx.save();

      // Center the coordinate system in the middle
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(this.viewDeltaX, this.viewDeltaY);
      ctx.scale(this.zoom, this.zoom);

      // Draw the sun artificially at the center of the map
      this._drawBody({
        name: 'sun',
        position: new Vector(0, 0, 0),
      })

      solarSystem.planets.forEach(function (planet) {
        this._drawBody(planet);
      }, this);

      ctx.restore();

      // Heads-up display elements (i.e., time, warp)
      this._drawHUD();

      numTimes++;
      if (numTimes >= numToRun) {
        console.log('All done!');
        return false;
      }

      this.time += dt;

    }.bind(this));
  };

  return CanvasDisplay;
});
