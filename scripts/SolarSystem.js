define(["Vector", "moment"], function (Vector, moment) {

  const AU = 149.59787e9;
  const J2000_date = moment('2000-01-01T12:00:00Z');
  const J2000_epoch = 2451545.0;

  function SolarSystem() {

    let planets = {
      "venus": {
        name: "venus",
        u: 0.3249e15 / Math.pow(AU, 3),
        a: [0.72332102, -0.00000026],
        e: [0.00676399, -0.00005107],
        I: [3.39777545, 0.00043494],
        L: [181.97970850, 58517.81560260],
        w: [131.76755713, 0.05679648],
        omega: [76.67261496, -0.27274174]
      },
      "mars": {
        name: "mars",
        u: 0.04283e15 / Math.pow(AU, 3),
        a: [1.52371034, 0.00001847],
        e: [0.09339410, 0.00007882],
        I: [1.84969142, -0.00813131],
        L: [-4.55343205, 19140.30268499],
        w: [-23.94362959, 0.44441088],
        omega: [49.55953891, -0.29257343],
      }
    }

    this.planets = [planets["venus"], planets["mars"]];
    this.bodies = [];
  };

  SolarSystem.prototype._calculateEccentricAnomaly = function (e, M) {
    // Calculate eccentric anomaly, E
    // e_star = degrees
    // e = radians
    let tol = 10e-6;
    let e_star = 57.29578 * e;
    let E = M + e_star * Math.sin((Math.PI / 180) * M);
    let deltaE, deltaM;
    let numTimes = 0;
    do {
      deltaM = M - (E - e_star * Math.sin((Math.PI / 180) * E));
      deltaE = deltaM / (1 - e * Math.cos((Math.PI / 180) * E));
      E = E + deltaE;
      numTimes++;
    } while (Math.abs(deltaE) > tol && numTimes <= 10);

    if (numTimes === 10) {
      console.log("Didn't iterate on a solution!");
    }

    return E;
  };

  SolarSystem.prototype._transformToEcliptic = function (position, w, omega, I) {

    let x = position.x;
    let y = position.y;
    let z = position.z;

    let x_ecl =
      (Math.cos(w) * Math.cos(omega) - Math.sin(w) * Math.sin(omega) * Math.cos(I)) * x +
      (-Math.sin(w) * Math.cos(omega) - Math.cos(w) * Math.sin(omega) * Math.cos(I)) * y;
    let y_ecl =
      (Math.cos(w) * Math.sin(omega) + Math.sin(w) * Math.cos(omega) * Math.cos(I)) * x +
      (-Math.sin(w) * Math.sin(omega) + Math.cos(w) * Math.cos(omega) * Math.cos(I)) * y;
    let z_ecl = Math.sin(w) * Math.sin(I) * x +
      Math.cos(w) * Math.sin(I) * y;

    return new Vector(x_ecl, y_ecl, z_ecl);
  };

  SolarSystem.prototype._calculatePlanetPosition = function (planet, T) {

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

    M = M % 360;
    if (M > 180) {
      M = M - 360;
    } else if (M < -180) {
      M = 360 + M;
    }

    E = this._calculateEccentricAnomaly(e, M);

    let trueAnomaly = Math.sign(E) * Math.acos(
      (Math.cos((Math.PI / 180) * E) - e) /
      (1 - e * Math.cos((Math.PI / 180) * E)))

    // Calculate heliocentric coordinates in the planets orbital plane
    let helioCentricPosition = new Vector(
      a * (Math.cos((Math.PI / 180) * E) - e),
      a * Math.sqrt(1 - Math.pow(e, 2)) * Math.sin((Math.PI / 180) * E),
      0);

    // Convert params to radians for this next transformation
    argumentPerihelion = argumentPerihelion * (Math.PI / 180);
    omega = omega * (Math.PI / 180);
    I = I * (Math.PI / 180);

    return {
      meanAnomaly: M * (Math.PI / 180),
      eccentricAnomaly: E * (Math.PI / 180),
      trueAnomaly: trueAnomaly,
      position: this._transformToEcliptic(helioCentricPosition, argumentPerihelion, omega, I)
    };
  };

  SolarSystem.prototype._calculateJulianDate = function (date) {
    let Teph = J2000_epoch + date.diff(J2000_date, 'days', true);
    let T = (Teph - J2000_epoch) / 36525;
    return T;
  }

  SolarSystem.prototype.update = function (t, dt) {

    let currentDate = moment(t + dt);
    let T = this._calculateJulianDate(currentDate);
    this.date = currentDate;

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

      let {
        meanAnomaly,
        trueAnomaly,
        eccentricAnomaly,
        position
      } = this._calculatePlanetPosition(planet, T);

      // Average Angular Velocity (units == rad/second)
      let n;
      if (!planet.lastMeanAnomaly) {
        n = Math.sqrt(planet.u / Math.pow(a, 3));
      } else {
        n = (meanAnomaly - planet.lastMeanAnomaly) / ((t + dt - planet.lastTime) / 1000);
      }

      planet.lastMeanAnomaly = meanAnomaly;
      planet.lastTime = t + dt;

      // Calculate time until periapsis
      let periapsisDelta, apoapsisDelta;

      if (meanAnomaly > 0) {
        periapsisDelta = (2 * Math.PI - meanAnomaly) / n;
        apoapsisDelta = (Math.PI - meanAnomaly) / n;
      } else if (meanAnomaly < 0) {
        periapsisDelta = -meanAnomaly / n
        apoapsisDelta = (Math.PI - meanAnomaly) / n;
      }

      const periapsisDate = currentDate.clone().add(periapsisDelta, 's');
      const apoapsisDate = currentDate.clone().add(apoapsisDelta, 's');
      const periapsis = this._calculatePlanetPosition(planet, this._calculateJulianDate(periapsisDate));
      const apoapsis = this._calculatePlanetPosition(planet, this._calculateJulianDate(apoapsisDate));

      planet.periapsis = {
        position: periapsis.position,
        date: periapsisDate
      };

      planet.apoapsis = {
        position: apoapsis.position,
        date: apoapsisDate
      };

      {
        // Semi-minor axis
        let b = a * Math.sqrt(1 - Math.pow(e, 2));
        let ellipseCenter = new Vector(-Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2)), 0, 0);

        // Convert params to radians for this next transformation
        let argumentPerihelion = (w - omega) * (Math.PI / 180);
        omega = omega * (Math.PI / 180);
        I = I * (Math.PI / 180);

        planet.center = this._transformToEcliptic(ellipseCenter, argumentPerihelion, omega, I);
        planet.semiMajorAxis = a;
        planet.semiMinorAxis = b;
      }

      planet.position = position;

    }, this);
  };

  return SolarSystem;
});
