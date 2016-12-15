requirejs(["SolarSystem",
    "CanvasDisplay",
    "Vector"
  ],

  function (SolarSystem, Display, Vector) {

    let solarSystem = new SolarSystem();
    let canvas = document.getElementById("expanse-simulation");
    let simulation = new Display(canvas, solarSystem);
    simulation.run();

    window.solarSystem = solarSystem;
    window.simulation = simulation;
  });
