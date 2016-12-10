requirejs(["SolarSystem", "CanvasDisplay", "Vector", "verlet-integrator"],

  function (SolarSystem, Display, Vector, VerletIntegrator) {

    const AU = 149597870700.0; // m
    const SUN_MASS = 1.989e30 / AU; // kg
    const EARTH_MASS = 5.97e24 / AU; // kg
    const MOON_MASS = 7.3476e22 / AU; // kg
    const JUPITER_MASS = 1.898e27 / AU; // kg
    const EARTH_TO_SUN = 149.6e9 / AU; // m
    const MOON_TO_EARTH = 0.3633e9 / AU; // m
    const UNIVERSAL_GRAVITY = 6.674e-11 / Math.pow(AU, 2); // N⋅m^2/kg^2

    let integrator = new VerletIntegrator(UNIVERSAL_GRAVITY);
    let solarSystem = new SolarSystem(integrator);

    let sun = solarSystem.addBody("sun", SUN_MASS);
    let earth = solarSystem.addBody("earth", EARTH_MASS);

    earth.position = new Vector(0, EARTH_TO_SUN, 0);
    earth.velocity = new Vector(-Math.sqrt(UNIVERSAL_GRAVITY * (SUN_MASS + EARTH_MASS) / EARTH_TO_SUN), 0, 0).times(1);

    let canvas = document.getElementById("expanse-simulation");
    let simulation = new Display(canvas, solarSystem);
    simulation.run();

  });
