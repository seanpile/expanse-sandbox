define(["app/Vector"], function (Vector) {

  function VerletIntegrator() {};

  VerletIntegrator.prototype.integrate =
    function (bodies, accelerationCallback, t, dt) {

      let updates = new Map();

      // Step 1;  Calculate updated positions

      bodies.forEach(function (body) {

        let acceleration = accelerationCallback(body, t);
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
        let a1 = accelerationCallback(body, t + dt);
        body.velocity = body.velocity.plus(a0.plus(a1).times(1 / 2 * dt));
      }, this);
    };

  return VerletIntegrator;
});
