const MIN_BODY_RADIUS = 5;
const MAX_BODY_RADIUS = 25;
const BASE_TIME_SCALE = 86400;
let timeScale = 5;
let numToRun = 10000;

define(function () {

  function CanvasDisplay(canvas, solarSystem) {

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.solarSystem = solarSystem;

    this.ctx.scale(-1, 1);
    this.ctx.translate(-canvas.width / 2, canvas.height / 2);
    this.ctx.rotate(Math.PI);
  };

  CanvasDisplay.prototype._runAnimation = function (frameFunc) {
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

  CanvasDisplay.prototype._drawBody = function (body) {
    let ctx = this.ctx;
    let canvas = this.canvas;

    ctx.beginPath();

    let radius, color;
    switch (body.name) {
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
    case "mars":
      radius = 5;
      color = "red";
      break;
    default:
      radius = 5;
      color = "black";
    }

    // Calculate unit vector
    let distance = body.position.magnitude();
    let position = body.position.times(Math.min(canvas.height, canvas.width) / 5);

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(position.x, position.y, Math.max(MIN_BODY_RADIUS, radius), 0, 2 * Math.PI);
    ctx.fill();
  };

  CanvasDisplay.prototype.run = function () {

    let last = 0;
    let numTimes = 0;

    let solarSystem = this.solarSystem;
    let ctx = this.ctx;
    let canvas = this.canvas;

    this._runAnimation(function (step) {

      // Update physics
      solarSystem.update(last, step);

      // Clear Canvas
      ctx.fillStyle = 'gray';
      ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

      solarSystem.forEach(function (body) {
        this._drawBody(body);
      }, this);

      ctx.strokeStyle = "red";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.lineTo(-50, 0);
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.lineTo(0, -50);
      ctx.stroke();

      last += step;
      numTimes++;
      if (numTimes >= numToRun) {
        console.log('All done!');
        return false;
      }
    }.bind(this));
  };

  return CanvasDisplay;
});
