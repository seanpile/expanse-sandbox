define(["moment", "three", "OrbitControls", "app/Vector"],
  function (moment, THREE, OrbitControls, Vector) {

    const DEFAULT_CAMERA_P = 1000;
    const DEFAULT_CAMERA_PHI = 0;
    const DEFAULT_CAMERA_THETA = 0;

    const MIN_ZOOM_LEVEL = 10;
    const MAX_ZOOM_LEVEL = 1000;
    const DEFAULT_ZOOM = 100;

    const PLANET_COLOURS = {
      "mercury": "silver",
      "mars": "red",
      "earth": "skyblue",
      "venus": "green",
      "sun": "yellow",
      "jupiter": "orange",
      "saturn": "tan",
      "pluto": "silver",
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

      let width = 1024;
      let height = 680;

      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(width, height);
      container.appendChild(this.renderer.domElement);

      //this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
      this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000);
      this.camera.position.z = 1000;
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
      this.orbitControls = new OrbitControls(this.camera, container);
      this.orbitControls.addEventListener('change', function (event) {});

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('gray');
      this.scene.add(new THREE.AxisHelper(1000));

      this.zoom = DEFAULT_ZOOM;

      addEventListener("keypress", function (event) {
        if (event.keyCode === 99) {
          this.recenter();
        }
      }.bind(this));
    };

    ThreeRenderer.prototype.recenter = function () {
      this.orbitControls.reset();
    };

    ThreeRenderer.prototype.initialize = function (solarSystem) {

      // Maintain a mapping from planet -> THREE object representing the planet
      // This will allow us to update the existing THREE object on each iteration
      // of the render loop.
      solarSystem.planets.forEach(function (planet) {

        let threeBody = this.scene.getObjectByName(planet.name);
        if (threeBody) {
          this.scene.remove(threeBody);
        }

        let geometry = new THREE.SphereGeometry(10, 32, 32);
        let material = new THREE.MeshBasicMaterial({
          color: PLANET_COLOURS[planet.name]
        });

        threeBody = new THREE.Mesh(geometry, material);
        threeBody.name = planet.name;
        this.scene.add(threeBody);

      }, this);

    };

    ThreeRenderer.prototype.render = function (simulation, solarSystem) {

      solarSystem.planets.forEach(function (planet) {

        let threeBody = this.scene.getObjectByName(planet.name);
        let position = planet.position.times(this.zoom);
        let apoapsis = planet.apoapsis.times(this.zoom);
        let periapsis = planet.periapsis.times(this.zoom);
        let semiMajorAxis = planet.semiMajorAxis * this.zoom;
        let center = planet.center.times(this.zoom);

        threeBody.position.x = position.x;
        threeBody.position.y = position.y;
        threeBody.position.z = position.z;

        this.scene.remove(this.scene.getObjectByName(`${planet.name}-trajectory`));

        var geometry = new THREE.CircleGeometry(semiMajorAxis, 32);
        var material = new THREE.LineBasicMaterial({
          color: PLANET_COLOURS[planet.name]
        });

        // Create the final object to add to the scene
        var trajectory = new THREE.Line(geometry, material);
        trajectory.translateX(center.x);
        trajectory.translateY(center.y);
        trajectory.translateZ(center.z);
        trajectory.rotateZ(planet.derivedValues.omega);
        trajectory.rotateX(planet.derivedValues.I);
        trajectory.rotateZ(planet.derivedValues.argumentPerihelion);
        trajectory.name = `${planet.name}-trajectory`;

        this.scene.add(trajectory);

      }, this);

      this.renderer.render(this.scene, this.camera);
    };

    return ThreeRenderer;
  });
