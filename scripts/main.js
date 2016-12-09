requirejs(["SolarSystem", "CanvasDisplay"], function (SolarSystem, Display) {

  let solarSystem = new SolarSystem();
  solarSystem.seed();

  let canvas = document.getElementById("expanse-simulation");
  let simulation = new Display(canvas, solarSystem);
  simulation.run();

});
