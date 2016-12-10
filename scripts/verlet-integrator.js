define(["Vector"], function (Vector) {

  function VerletIntegrator(universalGravity) {
    this.GravityConstant = universalGravity;
  };

  VerletIntegrator.prototype.force = function (body, attractors, t) {
    return attractors.reduce(function (prev, attractor) {
      let r = attractor.position.plus(body.position.times(-1));
      let F = r.times(this.GravityConstant * body.mass * attractor.mass / Math.pow(r.magnitude(), 3));
      return prev.plus(F);

    }.bind(this), new Vector(0, 0, 0));
  };

  VerletIntegrator.prototype.calculateAcceleration = function (body, allBodies, t) {
    let attractors = allBodies.filter(function (b) {
      return b !== body
    });
    return this.force(body, attractors, t).times(1 / body.mass);
  };

  VerletIntegrator.prototype.integrate = function (bodies, t, dt) {

    let updates = new Map();

    // Step 1;  Calculate updated positions

    bodies.forEach(function (body) {

      let acceleration = this.calculateAcceleration(body, bodies, t);
      let updatedPosition = body.position.plus(
        body.velocity.times(dt)).plus(
        acceleration.times(1 / 2 * Math.pow(dt, 2)));

      updates.set(body, {
        a0: acceleration,
        x1: updatedPosition,
      });
    }, this);

    // Step 2; update positions for all bodies
    bodies.forEach(function (body) {
      body.position = updates.get(body)['x1'];
    });

    // Step 3; update all velocities
    bodies.forEach(function (body) {

      let a0 = updates.get(body)["a0"];
      let a1 = this.calculateAcceleration(body, bodies, t + dt);
      body.velocity = body.velocity.plus(a0.plus(a1).times(1 / 2 * dt));
    }, this);
  };

  return VerletIntegrator;
});
