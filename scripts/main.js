requirejs.config({
  //By default load any module IDs from js/lib
  baseUrl: 'scripts/lib',
  //except, if the module ID starts with "app",
  //load it from the js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.
  paths: {
    app: '../app'
  }
});

requirejs([
    "app/SolarSystem",
    "app/CanvasRenderer",
    "app/ThreeRenderer",
    "app/Simulation",
    "app/Vector"
  ],

  function (SolarSystem, CanvasRenderer, ThreeRenderer, Simulation, Vector) {

    let container = document.getElementById('simulation-content');
    let backgroundImage = document.getElementById('stars-background');

    //let renderer = new CanvasRenderer(container, backgroundImage);
    let renderer = new ThreeRenderer(container);

    let solarSystem = new SolarSystem();
    let simulation = new Simulation(solarSystem, renderer);
    simulation.run();

    window.solarSystem = solarSystem;
    window.simulation = simulation;

    const keyCodes = {
      32: function (event) {
        if (simulation.isRunning()) {
          simulation.pause();
        } else {
          simulation.run();
        }
      },
      44: function (event) {
        simulation.slowDown();
      },
      46: function (event) {
        simulation.speedUp();
      }
    };

    addEventListener("keypress", function (event) {
      if (event.type === "keypress" && keyCodes.hasOwnProperty(event.keyCode)) {
        keyCodes[event.keyCode](event);
        event.preventDefault();
      }
    });
  });
