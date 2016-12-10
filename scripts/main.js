requirejs(["SolarSystem", "CanvasDisplay", "Vector", "verlet-integrator"],

  function (SolarSystem, Display, Vector, VerletIntegrator) {

    const AU = 149597870700.0; // m
    const SUN_MASS = 1.989e30 / AU; // kg
    const UNIVERSAL_GRAVITY = 6.674e-11 / Math.pow(AU, 2); // N⋅m^2/kg^2

    const EARTH = {
      name: "earth",
      mass: 5.97e24 / AU, // kg
      distanceToSun: 149.6e9 / AU, // m
      moons: [{
        name: "moon",
        mass: 7.3476e22 / AU, // kg
        distanceToPrimary: 0.3633e9 / AU // m
      }]
    };

    const MARS = {
      name: "mars",
      mass: 0.642e24 / AU, // kg
      distanceToSun: 227.9e9 / AU
    };

    let integrator = new VerletIntegrator(UNIVERSAL_GRAVITY);
    let solarSystem = new SolarSystem(integrator);

    let sun = solarSystem.addBody("sun", SUN_MASS);

    [EARTH, MARS].forEach(function (properties) {
      let body = solarSystem.addBody(properties.name, properties.mass);
      let random = Math.random();

      //randomized locations on a unit circle

      if (random <= 0.25) {
        body.position = new Vector(0, properties.distanceToSun, 0);
        body.velocity = new Vector(-Math.sqrt(UNIVERSAL_GRAVITY * (SUN_MASS + properties.mass) / properties.distanceToSun), 0, 0);
      } else if (random <= 0.5) {
        body.position = new Vector(-properties.distanceToSun, 0, 0);
        body.velocity = new Vector(0, -Math.sqrt(UNIVERSAL_GRAVITY * (SUN_MASS + properties.mass) / properties.distanceToSun), 0);
      } else {
        body.position = new Vector(0, -properties.distanceToSun, 0);
        body.velocity = new Vector(Math.sqrt(UNIVERSAL_GRAVITY * (SUN_MASS + properties.mass) / properties.distanceToSun), 0, 0);
      }

      if (properties.moons) {
        properties.moons.forEach(function (props) {
          let moon = solarSystem.addBody(props.name, props.mass);
          moon.position = body.position.plus(body.position.times(1 / body.position.magnitude()).times(props.distanceToPrimary));
          moon.velocity = body.velocity.plus(
            body.velocity.times(1 / body.velocity.magnitude()).times(-Math.sqrt(UNIVERSAL_GRAVITY * (props.mass + body.mass) / props.distanceToPrimary)));
        });
      }
    });

    let canvas = document.getElementById("expanse-simulation");
    let simulation = new Display(canvas, solarSystem);
    simulation.run();

  });
