define(["Vector", "moment"], function (Vector, moment) {

  // Julian Date corresponding to the J2000 epoch
  const J2000_date = moment('2000-01-01T12:00:00Z');
  const J2000_epoch = 2451545.0;

  function SolarSystem() {

    let planets = [{
      name: "mars",
      a: [1.52371034, 0.00001847],
      e: [0.09339410, 0.00007882],
      I: [1.84969142, -0.00813131],
      L: [-4.55343205, 19140.30268499],
      w: [-23.94362959, 0.44441088],
      omega: [49.55953891, -0.29257343],
    }];

    this.planets = planets;
    this.bodies = [];
  };

  SolarSystem.prototype._calculateEccentricAnomaly = function (e, M) {
    // Calculate eccentric anomaly, E
    // e_star = degrees
    // e = radians
    let tol = 10e-6;
    let e_star = 57.29578 * e;
    let E = M + e_star * M;
    let deltaE, deltaM;
    let numTimes = 0;
    do {
      deltaM = M - (E - e_star * Math.sin((Math.PI / 180) * E));
      deltaE = deltaM / (1 - e * Math.cos((Math.PI / 180) * E));
      E = E + deltaE;

      numTimes++;
    } while (Math.abs(deltaE) > tol && numTimes <= 10);

    return E;
  }

  SolarSystem.prototype.update = function (t, dt) {

    let currentDate = moment(t + dt);
    let Teph = J2000_epoch + currentDate.diff(J2000_date, 'days', true);
    let T = (Teph - J2000_epoch) / 36525;

    this.planets.forEach(function (planet) {

      let {
        name,
        a,
        e,
        I,
        L,
        w,
        omega
      } = planet;

      a = a[0] + a[1] * T;
      e = e[0] + e[1] * T;
      I = I[0] + I[1] * T;
      L = L[0] + L[1] * T;
      w = w[0] + w[1] * T;
      omega = omega[0] + omega[1] * T;

      let argumentPerihelion = w - omega;
      let M = L - w;

      M = (M % 360) - 180
      E = this._calculateEccentricAnomaly(e, M);

      // Calculate heliocentric coordinates in the planets orbital plane
      let x = a * (Math.cos((Math.PI / 180) * E) - e);
      let y = a * Math.sqrt(1 - Math.pow(e, 2)) * Math.sin((Math.PI / 180) * E);
      let z = 0;

      // Convert params to radians for this next transformation
      argumentPerihelion = argumentPerihelion * (Math.PI / 180);
      omega = omega * (Math.PI / 180);
      I = I * (Math.PI / 180);

      let x_ecl =
        (Math.cos(argumentPerihelion) * Math.cos(omega) - Math.sin(argumentPerihelion) * Math.sin(omega) * Math.cos(I)) * x +
        (-Math.sin(argumentPerihelion) * Math.cos(omega) - Math.cos(argumentPerihelion) * Math.sin(omega) * Math.cos(I)) * y;
      let y_ecl =
        (Math.cos(argumentPerihelion) * Math.sin(omega) + Math.sin(argumentPerihelion) * Math.cos(omega) * Math.cos(I)) * x +
        (-Math.sin(argumentPerihelion) * Math.sin(omega) + Math.cos(argumentPerihelion) * Math.cos(omega) * Math.cos(I)) * y;
      let z_ecl = Math.sin(argumentPerihelion) * Math.sin(I) * x +
        Math.cos(argumentPerihelion) * Math.sin(I) * y;

      planet.position = new Vector(x_ecl, y_ecl, z_ecl);
      planet.semiMajorAxis = a;
      planet.semiMinorAxis = a * Math.sqrt(1 - Math.pow(e, 2));

      console.log(new Vector(x, y, z).magnitude());
      console.log(planet.position.magnitude());

    }, this);
  };

  return SolarSystem;
});
