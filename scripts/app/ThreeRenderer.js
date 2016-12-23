define(["moment", "three", "OrbitControls", "app/Vector"],
  function (moment, THREE, OrbitControls, Vector) {

    const DEFAULT_CAMERA_P = 1000;
    const DEFAULT_CAMERA_PHI = 0;
    const DEFAULT_CAMERA_THETA = 0;

    const MIN_ZOOM_LEVEL = 10;
    const MAX_ZOOM_LEVEL = 1000;
    const AU_SCALE = 1;

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

    function ThreeRenderer(container) {

      let width = 1024;
      let height = 680;

      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(width, height);
      container.appendChild(this.renderer.domElement);

      //this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
      this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 100);
      this.camera.position.z = 5
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));

      let orbitControls = new OrbitControls(this.camera, container);
      this.orbitControls = orbitControls;
      this.orbitControls.addEventListener('change', function (event) {});

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('gray');

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

        this.scene.remove(this.scene.getObjectByName(planet.name));
        this.scene.remove(this.scene.getObjectByName(`${planet.name}-periapsis`));
        this.scene.remove(this.scene.getObjectByName(`${planet.name}-apoapsis`));

        let threeBody = new THREE.Mesh(new THREE.SphereGeometry(PLANET_SIZES[planet.name] / 100, 32, 32),
          new THREE.MeshBasicMaterial({
            color: PLANET_COLOURS[planet.name]
          }));

        let periapsis = new THREE.Mesh(new THREE.SphereGeometry(0.01, 32, 32),
          new THREE.MeshBasicMaterial({
            color: 'purple'
          }));

        let apoapsis = new THREE.Mesh(new THREE.SphereGeometry(0.01, 32, 32),
          new THREE.MeshBasicMaterial({
            color: 'aqua'
          }));

        threeBody.name = planet.name;
        periapsis.name = `${planet.name}-periapsis`;
        apoapsis.name = `${planet.name}-apoapsis`;

        this.scene.add(threeBody);
        this.scene.add(periapsis);
        this.scene.add(apoapsis);

      }, this);

    };

    ThreeRenderer.prototype.render = function (simulation, solarSystem) {

      solarSystem.planets.forEach(function (planet) {

        let threeBody = this.scene.getObjectByName(planet.name);
        let threePeriapsis = this.scene.getObjectByName(`${planet.name}-periapsis`);
        let threeApoapsis = this.scene.getObjectByName(`${planet.name}-apoapsis`);

        let derived = planet.derived;
        let position = derived.position.times(AU_SCALE);
        let apoapsis = derived.apoapsis.times(AU_SCALE);
        let periapsis = derived.periapsis.times(AU_SCALE);
        let semiMajorAxis = derived.semiMajorAxis * AU_SCALE;
        let semiMinorAxis = derived.semiMinorAxis * AU_SCALE;
        let center = derived.center.times(AU_SCALE);

        threeBody.position.set(position.x, position.y, position.z);
        threePeriapsis.position.set(periapsis.x, periapsis.y, periapsis.z);
        threeApoapsis.position.set(apoapsis.x, apoapsis.y, apoapsis.z);

        // Redraw the trajectory for this planet
        this.scene.remove(this.scene.getObjectByName(`${planet.name}-trajectory`));

        var trajectory = new THREE.Line(new THREE.CircleGeometry(semiMajorAxis, 32),
          new THREE.LineBasicMaterial({
            color: PLANET_COLOURS[planet.name]
          }));

        trajectory.translateX(center.x);
        trajectory.translateY(center.y);
        trajectory.translateZ(center.z);
        trajectory.rotateZ(derived.omega);
        trajectory.rotateX(derived.I);
        trajectory.rotateZ(derived.argumentPerihelion);
        trajectory.scale.set(1, semiMinorAxis / semiMajorAxis, 1);

        trajectory.name = `${planet.name}-trajectory`;
        this.scene.add(trajectory);

      }, this);

      this.renderer.render(this.scene, this.camera);
    };

    return ThreeRenderer;
  });
