const MIN_BODY_RADIUS = 5;
const MAX_BODY_RADIUS = 25;
const MIN_ZOOM_LEVEL = -20;
const MAX_ZOOM_LEVEL = 10;
const TIME_WARP_VALUES = [1, 5, 10, 50, 100, 10e2, 10e3, 10e4, 10e5, 10e6];
let numToRun = 10000;

define(["moment"], function (moment) {

  function CanvasDisplay(canvas, solarSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.solarSystem = solarSystem;
    this.time = Date.now();
    this.timeWarpIdx = 6;
    this.zoomScale = -5;
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

    let radius, color;
    switch (planet.name) {
    case "sun":
      radius = 25;
      color = "yellow";
      break;
    case "earth":
      radius = 10;
      color = "blue";
      break;
    case "moon":
      radius = 3;
      color = "purple";
      break;
    case "venus":
      radius = 5;
      color = "green";
      break;
    case "mars":
      radius = 5;
      color = "red";
      break;
    default:
      radius = 5;
      color = "black";
    }

    let zoom = this.zoomScale < 0 ? 1 / Math.abs(this.zoomScale) : Math.max(this.zoomScale, 1);

    let scale = Math.min(canvas.height, canvas.width) * zoom;
    let trajectoryCenter = planet.center.times(scale);
    let trajectoryMajor = planet.semiMajorAxis * scale;
    let trajectoryMinor = planet.semiMinorAxis * scale;

    // Calculate elliptical plot
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.ellipse(
      trajectoryCenter.x,
      trajectoryCenter.y,
      trajectoryMajor,
      trajectoryMinor, 0, 0, 2 * Math.PI);
    ctx.stroke();

    let position = planet.position.times(scale);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(position.x, position.y, Math.max(MIN_BODY_RADIUS, radius), 0, 2 * Math.PI);
    ctx.fill();

    if (planet.periapsis) {
      let periapsis = planet.periapsis.position.times(scale);
      ctx.beginPath();
      ctx.fillStyle = 'aqua';
      ctx.arc(periapsis.x, periapsis.y, Math.max(MIN_BODY_RADIUS, radius), 0, 2 * Math.PI);
      ctx.fill();
    }

    if (planet.apoapsis) {
      let apoapsis = planet.apoapsis.position.times(scale);
      ctx.beginPath();
      ctx.fillStyle = 'aqua';
      ctx.arc(apoapsis.x, apoapsis.y, Math.max(MIN_BODY_RADIUS, radius), 0, 2 * Math.PI);
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

  CanvasDisplay.prototype.zoomIn = function () {
    this.zoomScale = Math.min(this.zoomScale + 1, MAX_ZOOM_LEVEL);
  };

  CanvasDisplay.prototype.zoomOut = function () {
    this.zoomScale = Math.max(this.zoomScale - 1, MIN_ZOOM_LEVEL);
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
      ctx.fillStyle = 'gray';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Heads-up display elements (i.e., time, warp)
      this._drawHUD();

      ctx.save();

      // Center the coordinate system in the middle
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);

      solarSystem.planets.forEach(function (planet) {
        this._drawBody(planet);
      }, this);

      ctx.strokeStyle = "silver";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-20, 0);
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(0, -20);
      ctx.stroke();

      ctx.restore();

      numTimes++;
      this.time += dt;
      if (numTimes >= numToRun) {
        console.log('All done!');
        return false;
      }
    }.bind(this));
  };

  return CanvasDisplay;
});
