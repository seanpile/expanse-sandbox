define(["Vector"], function (Vector) {

  function SolarSystem(integrator) {
    this.bodies = [];
    this.integrator = integrator;
  };

  // Calculate a new 'CoM' given all of the current bodies and update the
  // coordinates of all current bodies.
  SolarSystem.prototype.update = function (t, dt) {

    //this.updateBarycenter();
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

    this.bodies.forEach(function (body) {
      body.position = body.position.plus(newCenterOfMass);
      body.velocity = body.velocity.plus(newCenterOfMass);
    });
  };

  SolarSystem.prototype.updateEphemeris = function (t, dt) {
    this.integrator.integrate(this.bodies, t, dt);
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
  };

  return SolarSystem;
});
