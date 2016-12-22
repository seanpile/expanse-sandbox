define(["moment"], function (moment) {

  const numToRun = 10000;

  function Simulation(solarSystem, renderer) {
    this.solarSystem = solarSystem;
    this.renderer = renderer;
    this.isStopped = true;
    this.time = Date.now();
    this.timeWarpValues = [1, 5, 10, 50, 100, 10e2, 10e3, 10e4, 10e5, 10e6, 10e7];
    this.timeWarpIdx = 6;
    this.viewDeltaX = 0;
    this.viewDeltaY = 0;
  };

  function runAnimation(frameFunc) {
    var lastTime = null;

    function frame(time) {
      var stop = false;
      if (lastTime != null) {
        var timeStep = (time - lastTime);
        stop = frameFunc(timeStep) === false;
      }
      lastTime = time;
      if (!stop)
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  Simulation.prototype.speedUp = function () {
    if (this.isStopped) {
      return;
    }

    this.timeWarpIdx = Math.min(this.timeWarpValues.length - 1, this.timeWarpIdx + 1);
  };

  Simulation.prototype.slowDown = function () {
    if (this.isStopped) {
      return;
    }

    this.timeWarpIdx = Math.max(0, this.timeWarpIdx - 1);
  };

  Simulation.prototype.pause = function () {
    this.isStopped = true;
  };

  Simulation.prototype.zoomIn = function (x, y) {
    if (this.isStopped) {
      return;
    }

    this.renderer.zoomIn(x, y);
  };

  Simulation.prototype.zoomOut = function (x, y) {
    if (this.isStopped) {
      return;
    }

    this.renderer.zoomOut(x, y);
  };

  Simulation.prototype.recenter = function () {
    if (this.isStopped) {
      return;
    }

    this.renderer.recenter();
  };

  Simulation.prototype.moveViewBy = function (deltaX, deltaY) {
    if (this.isStopped) {
      return;
    }

    this.renderer.moveViewBy(deltaX, deltaY);
  };

  Simulation.prototype.isRunning = function () {
    return !this.isStopped;
  }

  Simulation.prototype.run = function () {

    if (this.isRunning()) {
      return;
    }

    this.isStopped = false;
    this.solarSystem.update(this.time, 0);
    this.renderer.initialize(this.solarSystem);

    let numTimes = 0;

    runAnimation(function (dt) {

      if (this.isStopped) {
        return false;
      }

      let t = this.time;
      let timeScale = this.timeWarpValues[this.timeWarpIdx];
      dt *= timeScale;

      // Update physics
      this.solarSystem.update(t, dt);
      this.renderer.render(this, solarSystem);

      numTimes++;
      if (numTimes >= numToRun) {
        console.log('All done!');
        this.isStopped = true;
        return false;
      }

      this.time += dt;

    }.bind(this));
  };

  return Simulation;
});
