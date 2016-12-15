define(["Vector"], function (Vector) {

  function RungeKuttaIntegrator() {};

  function Derivitives() {
    this.dx = new Vector(0, 0, 0);
    this.dv = new Vector(0, 0, 0);
  };

  RungeKuttaIntegrator.prototype._evaluate =
    function (bodies, accelerationCallback, t, dt, derivitives) {

      let newBodies = new Map();
      bodies.forEach(function (body) {
        let b = body.clone();

        if (derivitives.has(body)) {
          let derivitive = derivitives.get(body);
          b.position = body.position.plus(derivitive.dx.times(dt));
          b.velocity = body.velocity.plus(derivitive.dv.times(dt));
        }

        newBodies.set(body, b);
      });

      let newDerivitives = new Map();
      let allBodies = Array.from(newBodies.values());

      bodies.forEach(function (body) {

        let b = newBodies.get(body);
        let derivitive = new Derivitives();
        derivitive.dx = b.velocity;
        derivitive.dv = accelerationCallback(b, t + dt);
        newDerivitives.set(body, derivitive);

      }, this);

      return newDerivitives;
    };

  RungeKuttaIntegrator.prototype.integrate =
    function (bodies, accelerationCallback, t, dt) {

      let a, b, c, d;

      a = this._evaluate(bodies, accelerationCallback, t, 0.0, new Map());
      b = this._evaluate(bodies, accelerationCallback, t, dt * 0.5, a);
      c = this._evaluate(bodies, accelerationCallback, t, dt * 0.5, b);
      d = this._evaluate(bodies, accelerationCallback, t, dt, c);

      bodies.forEach(function (body) {

        let a1 = a.get(body);
        let b1 = b.get(body);
        let c1 = c.get(body);
        let d1 = d.get(body);

        let dxdt = b1.dx.plus(c1.dx).times(2.0).plus(a1.dx).plus(d1.dx).times(1.0 / 6.0);
        let dvdt = b1.dv.plus(c1.dv).times(2.0).plus(a1.dv).plus(d1.dv).times(1.0 / 6.0);

        body.position = body.position.plus(dxdt.times(dt));
        body.velocity = body.velocity.plus(dvdt.times(dt));
      });
    };

  return RungeKuttaIntegrator;
});
