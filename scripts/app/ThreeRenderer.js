define(["moment", "three", "app/Vector"], function (moment, THREE, Vector) {

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

  function ThreeRenderer(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(1024, 680);

    container.appendChild(this.renderer.domElement);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00
    });
    var cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    this.cube = cube;
    this.camera.position.z = 5;

    this.zoom = DEFAULT_ZOOM;
    this.viewDeltaX = 0;
    this.viewDeltaY = 0;
  };

  ThreeRenderer.prototype._drawBody = function (planet) {
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

  ThreeRenderer.prototype._drawHUD = function (simulation) {

    /*
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
    */
  };

  ThreeRenderer.prototype.zoomIn = function (x, y) {
    this.zoom = Math.min(this.zoom + 15, MAX_ZOOM_LEVEL);
  };

  ThreeRenderer.prototype.zoomOut = function (x, y) {
    this.zoom = Math.max(this.zoom - 15, MIN_ZOOM_LEVEL);
  };

  ThreeRenderer.prototype.recenter = function () {
    this.viewDeltaX = 0;
    this.viewDeltaY = 0;
    this.zoom = DEFAULT_ZOOM;
  };

  ThreeRenderer.prototype.moveViewBy = function (deltaX, deltaY) {
    this.viewDeltaX += deltaX;
    this.viewDeltaY += deltaY;
  };

  ThreeRenderer.prototype.redraw = function (simulation, solarSystem) {

    console.log(this.cube.position);
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);

    /*

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

    */

  };

  return ThreeRenderer;
});
