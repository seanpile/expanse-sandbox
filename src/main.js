import SolarSystem from './app/SolarSystem';
import CanvasRenderer from './app/CanvasRenderer';
import ThreeRenderer from './app/ThreeRenderer';
import Simulation from './app/Simulation';
import Vector from './app/Vector';
import Stats from 'stats.js';

let container = document.getElementById('simulation-content');
let backgroundImage = document.getElementById('stars-background');

//let renderer = new CanvasRenderer(container, backgroundImage);
let renderer = new ThreeRenderer(container);
let solarSystem = new SolarSystem();

let stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

let simulation = new Simulation(solarSystem, renderer, stats);
simulation.initialize();

window.solarSystem = solarSystem;
window.simulation = simulation;
window.addEventListener("blur", function (event) {
  simulation.pause();
});
window.addEventListener("unload", function (event) {
  simulation.pause();
});

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
    console.log("speeding up");
    simulation.speedUp();
  }
};

addEventListener("keypress", function (event) {
  if (event.type === "keypress" && keyCodes.hasOwnProperty(event.keyCode)) {
    keyCodes[event.keyCode](event);
    event.preventDefault();
  }
});
