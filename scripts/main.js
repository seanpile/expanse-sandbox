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

    var keyCodes = {
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
      },
      99: function (event) {
        simulation.recenter();
      }
    };

    addEventListener("keypress", function (event) {
      if (event.type === "keypress" && keyCodes.hasOwnProperty(event.keyCode)) {
        keyCodes[event.keyCode](event);
        event.preventDefault();
      }
    });

    addEventListener("wheel", function (event) {
      event.preventDefault();
      if (event.deltaY > 0) {
        simulation.zoomOut();
      } else if (event.deltaY < 0) {
        simulation.zoomIn(event.clientX, event.clientY);
      }
    });

    addEventListener("mousedown", function (event) {
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

            simulation.moveViewBy(deltaX, deltaY);
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

  });
