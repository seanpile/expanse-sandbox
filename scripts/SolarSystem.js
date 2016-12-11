define(["Vector"], function (Vector) {

  function SolarSystem(GravityConstant, integrator) {
    this.bodies = [];
    this.GravityConstant = GravityConstant;
    this.integrator = integrator;
  };

  SolarSystem.prototype.init = function () {
    this.updateBarycenter();
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
    });
  };

  SolarSystem.prototype.update = function (t, dt) {
    this.integrator.integrate(this.bodies, t, dt);
    this.updateBarycenter();

    this.forEach(function (body) {

      if (body.name === "sun") return;

      let v = body.velocity.plus(body.primary.velocity.times(-1));
      let r = body.position.plus(body.primary.position.times(-1));
      let m = body.mass;

      let specificOrbitalEnergy = Math.pow(v.magnitude(), 2) / 2 -
        (this.GravityConstant * (body.mass + body.primary.mass)) / r.magnitude();

      let specificRelativeAngularMomentum = r.cross(v);

      let e = Math.sqrt(1 + (2 * specificOrbitalEnergy * Math.pow(specificRelativeAngularMomentum.magnitude(), 2)) / Math.pow(this.GravityConstant * (body.mass + body.primary.mass), 2))
      let semiMajorAxis = -this.GravityConstant * (body.mass + body.primary.mass) / (2 * specificOrbitalEnergy);

      console.log(`${body.name} e = ${e}`);
      console.log(`${body.name} semiMajorAxis = ${semiMajorAxis}`);

    }, this);
  };

  SolarSystem.prototype.forEach = function (each, context) {
    this.bodies.forEach(each, context);
  };

  SolarSystem.prototype.addBody = function (name, mass, primary) {
    let body = new Body(name, mass, primary);
    this.bodies.push(body);
    return body;
  };

  function Body(name, mass, primary) {
    this.name = name;
    this.mass = mass;
    this.primary = primary;
    this.position = new Vector(0, 0, 0);
    this.velocity = new Vector(0, 0, 0);
  };

  Body.prototype.clone = function () {
    let b = new Body(this.name, this.mass, this.primary);
    b.position = new Vector(this.position.x, this.position.y, this.position.z);
    b.velocity = new Vector(this.velocity.x, this.velocity.y, this.velocity.z);
    return b;
  };

  return SolarSystem;
});
