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

    var keyCodes = {
      32: function (event) {
        if (event.target.value === "Pause") {
          simulation.pause();
          event.target.value = "Run";
        } else {
          simulation.run();
          event.target.value = "Pause";
        }

        event.preventDefault();
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
      }
    });
  });
