requirejs(["SolarSystem",
    "CanvasDisplay",
    "Vector",
    "verlet-integrator",
    "runge-kutta-integrator"
  ],

  function (SolarSystem,
    Display,
    Vector,
    VerletIntegrator,
    RungeKuttaIntegrator) {

    const AU = 149597870700.0; // m
    const UNIVERSAL_GRAVITY = 6.674e-11 / Math.pow(AU, 2); // N⋅m^2/kg^2
    const SUN = {
      name: "sun",
      mass: 1.989e30 / AU, // kg
      distanceToPrimary: 0,
      secondaries: [{
        name: "earth",
        mass: 5.97e24 / AU, // kg
        distanceToPrimary: 149.6e9 / AU, // m
        secondaries: [{
          name: "moon",
          mass: 7.3476e22 / AU, // kg
          distanceToPrimary: 0.3633e9 / AU // m
        }]
      }, {
        name: "mars",
        mass: 0.642e24 / AU, // kg
        distanceToPrimary: 227.9e9 / AU
      }]
    }

    let integrator = new RungeKuttaIntegrator(UNIVERSAL_GRAVITY);
    //let integrator = new VerletIntegrator(UNIVERSAL_GRAVITY);
    let solarSystem = new SolarSystem(UNIVERSAL_GRAVITY, integrator);

    function seed(props, primary) {
      let body = solarSystem.addBody(props.name, props.mass, primary);

      // Except for the sun, set the initial position/velocity for all objects
      if (primary) {
        body.position = primary.position.plus(new Vector(0, props.distanceToPrimary, 0));
        body.velocity = primary.velocity.plus(new Vector(-Math.sqrt(UNIVERSAL_GRAVITY * (body.mass + primary.mass) / props.distanceToPrimary), 0, 0));
      }

      // Set initial position, velocity
      // Add each secondary
      if (props.secondaries) {
        props.secondaries.forEach(function (secondary) {
          seed(secondary, body);
        });
      }
    }

    seed(SUN);
    solarSystem.init();

    let canvas = document.getElementById("expanse-simulation");
    let simulation = new Display(canvas, solarSystem);
    simulation.run();

    window.solarSystem = solarSystem;
    window.simulation = simulation;
  });
