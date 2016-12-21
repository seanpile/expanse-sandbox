define(["moment", "app/Vector"], function (moment, Vector) {

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
    "saturn": "tan"
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

  function CanvasRenderer(container, backgroundImage) {

    let document = container.getRootNode();
    let canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    container.appendChild(canvas);

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.backgroundImage = backgroundImage;

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
    // Do nothing; we redraw all elements on every loop
  };

  CanvasRenderer.prototype.render = function (simulation, solarSystem) {
    const ctx = this.ctx;
    const canvas = this.canvas;

    // Clear Canvas
    ctx.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);
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
    this._drawHUD(simulation);

  };

  return CanvasRenderer;
});
