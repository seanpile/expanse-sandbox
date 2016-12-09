define(["Vector"], function (Vector) {

  const AU = 149597870700.0; // m
  const SUN_MASS = 1.989e30 / AU; // kg
  const EARTH_MASS = 5.97e24 / AU; // kg
  const MOON_MASS = 7.3476e22 / AU; // kg
  const JUPITER_MASS = 1.898e27 / AU; // kg
  const EARTH_TO_SUN = 149.6e9 / AU; // m
  const MOON_TO_EARTH = 0.3633e9 / AU; // m
  const UNIVERSAL_GRAVITY = 6.674e-11 / Math.pow(AU, 2); // N⋅m^2/kg^2

  function SolarSystem() {
    this.bodies = [];
  };

  SolarSystem.prototype.seed = function () {

    let sun = this.addBody("sun", SUN_MASS);
    let earth = this.addBody("earth", EARTH_MASS);
    let moon = this.addBody("moon", MOON_MASS);

    earth.position = new Vector(0, EARTH_TO_SUN, 0);
    earth.velocity = new Vector(-Math.sqrt(UNIVERSAL_GRAVITY * (SUN_MASS + EARTH_MASS) / EARTH_TO_SUN), 0, 0).times(1);
    earth.momentum = earth.velocity.times(earth.mass);
    earth.updateMomentum(earth.momentum);

    moon.position = new Vector(0, EARTH_TO_SUN + 10 * MOON_TO_EARTH, 0);
    moon.velocity = new Vector(-Math.sqrt(UNIVERSAL_GRAVITY * (SUN_MASS + MOON_MASS) / (EARTH_TO_SUN + 2 * MOON_TO_EARTH)), 0, 0).times(1);
    moon.momentum = moon.velocity.times(moon.mass);
    moon.updateMomentum(moon.momentum);
  };

  // Calculate a new 'CoM' given all of the current bodies and update the
  // coordinates of all current bodies.
  SolarSystem.prototype.update = function (t, dt) {

    this.updateBarycenter();
    this.updateEphemeris(t, dt);

  };

  // Calcluate the barycenter of the system and adjust the coordinate
  // system accordingly.
  SolarSystem.prototype.updateBarycenter = function () {
    let upper = this.bodies.reduce(function (prev, current) {
      return prev.plus(current.position.times(current.mass));
    }, new Vector(0, 0, 0));

    let lower = this.bodies.reduce(function (prev, current) {
      return prev + current.mass;
    }, 0);

    let newCenterOfMass = upper.times(-1 / lower);

    // TBD: Should velocity and momentum be adjusted here, or just position?
    this.bodies.forEach(function (body) {
      body.position = body.position.plus(newCenterOfMass);
      body.velocity = body.velocity.plus(newCenterOfMass);
      body.momentum = body.momentum.plus(newCenterOfMass);
    });
  };

  SolarSystem.prototype.updateEphemeris = function (t, dt) {

    let updates = new Map();
    let bodies = this.bodies;

    bodies.forEach(function (body) {

      let attractors = bodies.filter(function (b) {
        return b !== body
      });
      let changes = integrate(body, attractors, t, dt);

      updates.set(body, changes);
    });

    bodies.forEach(function (body) {

      let changes = updates.get(body);
      body.position = body.position.plus(changes["dxdt"]);
      body.updateMomentum(body.momentum.plus(changes["dpdt"]));
    })
  };

  SolarSystem.prototype.forEach = function (each, context) {
    this.bodies.forEach(each, context);
  };

  SolarSystem.prototype.addBody = function (name, mass) {
    let body = new Body(name, mass);
    this.bodies.push(body);
    return body;
  };

  function Body(name, mass) {
    this.name = name;
    this.mass = mass;
    this.inverseMass = 1 / mass;
    this.position = new Vector(0, 0, 0);
    this.velocity = new Vector(0, 0, 0);
    this.momentum = new Vector(0, 0, 0);
  };

  Body.prototype.clone = function () {
    let b = new Body(this.name, this.mass);
    return b;
  };

  Body.prototype.updateMomentum = function (momentum) {
    this.momentum = momentum;
    this.velocity = momentum.times(this.inverseMass);

    // let u = UNIVERSAL_GRAVITY * this.primary.mass;
    //
    // //https://en.wikipedia.org/wiki/Orbital_eccentricity
    // //https://en.wikipedia.org/wiki/Eccentricity_vector
    // //e = |eccentricity_vector|
    //
    // let orbitalEnergy = Math.pow(this.velocity.magnitude(), 2) / 2 -
    //   (u / this.position.magnitude());
    //
    // //let specificRelativeAngularMomentum =
    //
    // this.semiMajorAxis = -u / (2 * orbitalEnergy);
    //this.eccentricity = Math.sqrt(1 + (2 * orbitalEnergy * Math.pow(specificRelativeAngularMomentum, 2) / Math.pow(UNIVERSAL_GRAVITY * this.primary.mass, 2)))
  }

  function force(body, attractors, t) {
    return attractors.reduce(function (prev, attractor) {

      let r = attractor.position.plus(body.position.times(-1));
      let F = r.times(UNIVERSAL_GRAVITY * body.mass * attractor.mass / Math.pow(r.magnitude(), 3));
      return prev.plus(F);

    }, new Vector(0, 0, 0));
  }

  function Derivitives() {
    this.dx = new Vector(0, 0, 0);
    this.dp = new Vector(0, 0, 0);
  };

  function evaluate(body, attractors, t, dt, changes) {

    let updatedBody = body.clone();
    updatedBody.position = body.position.plus(changes.dx.times(dt));
    updatedBody.updateMomentum(body.momentum.plus(changes.dp.times(dt)));

    let derivitives = new Derivitives();
    derivitives.dx = updatedBody.velocity;
    derivitives.dp = force(updatedBody, attractors, t + dt);
    return derivitives;
  }

  function integrate(body, attractors, t, dt) {

    let a, b, c, d;

    a = evaluate(body, attractors, t, 0, new Derivitives());
    b = evaluate(body, attractors, t, dt * 0.5, a);
    c = evaluate(body, attractors, t, dt * 0.5, b);
    d = evaluate(body, attractors, t, dt, c);

    let dxdt = (a.dx.plus(b.dx.plus(c.dx).times(2.0)).plus(d.dx)).times(1.0 / 6.0);
    let dpdt = (a.dp.plus(b.dp.plus(c.dp).times(2.0)).plus(d.dp)).times(1.0 / 6.0);

    return {
      dxdt: dxdt.times(dt),
      dpdt: dpdt.times(dt)
    };
  };

  return SolarSystem;
});
