define(["app/Planets", "app/Vector", "app/util/MovingAverage", "moment"],
  function (PLANETS, Vector, MovingAverage, moment) {

    const J2000_date = moment('2000-01-01T12:00:00Z');
    const J2000_epoch = 2451545.0;

    function SolarSystem() {

      this.planets = Object.keys(PLANETS).map(function (name) {
        //this.planets = ["mercury"].map(function (name) {
        let planet = PLANETS[name];
        planet.name = name;
        planet.derived = {};
        planet.derived.averageAngularVelocity = new MovingAverage(5);
        return planet;
      });
      this.bodies = [];
    };

    SolarSystem.prototype.update = function (t, dt) {

      let currentDate = moment(t + dt);
      let T = this._calculateJulianDate(currentDate);

      this.planets.forEach(function (planet) {

        let kepler_elements = planet.kepler_elements;
        let planet_constants = planet.constants;
        let derived = planet.derived;

        let {
          a,
          e,
          I,
          L,
          w,
          omega,
          perturbations
        } = kepler_elements;

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
        } = this._calculatePlanetPosition(a, e, I, L, w, omega, perturbations, T);

        // Average Angular Velocity (units == rad/second)
        let n;

        if (!derived.hasOwnProperty('lastMeanAnomaly')) {
          n = Math.sqrt(planet_constants.u / Math.pow(a, 3));
        } else if (Math.sign(meanAnomaly) === Math.sign(derived.lastMeanAnomaly) ||
          Math.sign(meanAnomaly) >= 0) {
          n = (meanAnomaly - derived.lastMeanAnomaly) / ((t + dt - this.lastTime) / 1000);
        } else if (Math.sign(meanAnomaly) < 0) {
          n = (2 * Math.PI + meanAnomaly - derived.lastMeanAnomaly) / ((t + dt - this.lastTime) / 1000);
        }

        let averageAngularVelocity = derived.averageAngularVelocity;
        averageAngularVelocity.add(n);
        n = averageAngularVelocity.average();

        // Semi-minor axis
        let b = a * Math.sqrt(1 - Math.pow(e, 2));
        let periapsis = new Vector(a * (1 - e), 0, 0);
        let apoapsis = new Vector(-a * (1 + e), 0, 0);
        let center = new Vector(periapsis.x - a, 0, 0);

        // Convert params to radians for this next transformation
        let argumentPerihelion = (w - omega) * (Math.PI / 180);
        omega = omega * (Math.PI / 180);
        I = I * (Math.PI / 180);
        w = w * (Math.PI / 180);

        planet.derived = {
          T: T,
          a: a,
          e: e,
          I: I,
          w: w,
          omega: omega,
          argumentPerihelion: argumentPerihelion,
          position: position,
          averageAngularVelocity: averageAngularVelocity,
          lastMeanAnomaly: meanAnomaly,
          semiMajorAxis: a,
          semiMinorAxis: b,
          center: this._transformToEcliptic(center, argumentPerihelion, omega, I),
          periapsis: this._transformToEcliptic(periapsis, argumentPerihelion, omega, I),
          apoapsis: this._transformToEcliptic(apoapsis, argumentPerihelion, omega, I),
        }

      }, this);

      this.lastTime = t + dt;
    };

    SolarSystem.prototype._calculatePlanetPosition = function (a, e, I, L, w, omega, perturbations, T) {

      let argumentPerihelion = w - omega;
      let M = L - w;
      if (perturbations) {
        M += perturbations.b * Math.pow(T, 2) +
          perturbations.c * Math.cos(perturbations.f * T) +
          perturbations.s * Math.sin(perturbations.f * T);
      }

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

      // Convert to the ecliptic plane
      let eclipticPosition = this._transformToEcliptic(
        helioCentricPosition,
        argumentPerihelion * Math.PI / 180,
        omega * Math.PI / 180,
        I * Math.PI / 180)

      return {
        meanAnomaly: M * (Math.PI / 180),
        eccentricAnomaly: E * (Math.PI / 180),
        trueAnomaly: trueAnomaly,
        position: eclipticPosition
      };
    };

    SolarSystem.prototype._calculateJulianDate = function (date) {
      let Teph = J2000_epoch + date.diff(J2000_date, 'days', true);
      let T = (Teph - J2000_epoch) / 36525;
      return T;
    }

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

    return SolarSystem;
  });
