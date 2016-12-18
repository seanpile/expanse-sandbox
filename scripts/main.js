requirejs(["SolarSystem",
    "CanvasRenderer",
    "Simulation",
    "Vector"
  ],

  function (SolarSystem, CanvasRenderer, Simulation, Vector) {

    let canvas = document.getElementById("expanse-simulation");
    let backgroundImage = document.getElementById("stars-background");
    let renderer = new CanvasRenderer(canvas, backgroundImage);
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

        event.preventDefault();
      },
      44: function (event) {
        simulation.slowDown();
        event.preventDefault();
      },
      46: function (event) {
        simulation.speedUp();
        event.preventDefault();
      },
      99: function (event) {
        simulation.recenter();
        event.preventDefault();
      }
    };

    addEventListener("keypress", function (event) {
      if (event.type === "keypress" && keyCodes.hasOwnProperty(event.keyCode)) {
        keyCodes[event.keyCode](event);
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
      if (event.target === canvas) {
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
      }
    })

  });
