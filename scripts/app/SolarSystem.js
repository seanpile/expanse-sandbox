define(["app/Vector", "moment"], function (Vector, moment) {

  const AU = 149.59787e9;
  const J2000_date = moment('2000-01-01T12:00:00Z');
  const J2000_epoch = 2451545.0;

  function SolarSystem() {

    let planetData = {
      "venus": {
        name: "venus",
        u: 0.3249e15 / Math.pow(AU, 3),
        a: [0.72332102, -0.00000026],
        e: [0.00676399, -0.00005107],
        I: [3.39777545, 0.00043494],
        L: [181.97970850, 58517.81560260],
        w: [131.76755713, 0.05679648],
        omega: [76.67261496, -0.27274174],
        radius: 6.0518e6 / AU
      },
      "mars": {
        name: "mars",
        u: 0.04283e15 / Math.pow(AU, 3),
        a: [1.52371243, 0.00000097],
        e: [0.09336511, 0.00009149],
        I: [1.85181869, -0.00724757],
        L: [-4.56813164, 19140.29934243],
        w: [-23.91744784, 0.45223625],
        omega: [49.71320984, -0.26852431],
        radius: 3.397e6 / AU
      },
      "earth": {
        name: "earth",
        u: 0.3986e15 / Math.pow(AU, 3),
        a: [1.00000018, -0.00000003],
        e: [0.01673163, -0.00003661],
        I: [-0.00054346, -0.01337178],
        L: [100.46691572, 35999.37306329],
        w: [102.93005885, 0.31795260],
        omega: [-5.11260389, -0.24123856],
        radius: 6.3781e6 / AU
      },
      "mercury": {
        name: "mercury",
        u: 0.02203e15 / Math.pow(AU, 3),
        a: [0.38709843, 0.0],
        e: [0.20563661, 0.00002123],
        I: [7.00559432, -0.00590158],
        L: [252.25166724, 149472.67486623],
        w: [77.45771895, 0.15940013],
        omega: [48.33961819, -0.12214182],
        radius: 2.4397e6 / AU
      },
      "jupiter": {
        name: "jupiter",
        u: 126.686e15 / Math.pow(AU, 3),
        a: [5.20248019, -0.00002864],
        e: [0.04853590, 0.00018026],
        I: [1.29861416, -0.00322699],
        L: [34.33479152, 3034.90371757],
        w: [14.27495244, 0.18199196],
        omega: [100.29282654, 0.13024619],
        radius: 7.1492e7 / AU,
        perturbations: {
          b: -0.00012452,
          c: 0.6064060,
          s: -0.35635438,
          f: 38.35125000
        }
      },
      "saturn": {
        name: "saturn",
        u: 37.391e15 / Math.pow(AU, 3),
        a: [9.54149883, -0.00003065],
        e: [0.05550825, -0.00032044],
        I: [2.49424102, 0.00451969],
        L: [50.07571329, 1222.11494724],
        w: [92.86136063, 0.54179478],
        omega: [113.63998702, -0.25015002],
        radius: 6.0268e7 / AU,
        perturbations: {
          b: 0.00025899,
          c: -0.13434469,
          s: 0.87320147,
          f: 38.35125000
        }
      }
    }

    this.planets = Object.keys(planetData).map(function (name) {
      let planet = planetData[name];
      planet.averageAngularVelocity = new MovingAverage(5);
      return planet;
    });
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
      omega,
      perturbations
    } = planet;

    a = a[0] + a[1] * T;
    e = e[0] + e[1] * T;
    I = I[0] + I[1] * T;
    L = L[0] + L[1] * T;
    w = w[0] + w[1] * T;
    omega = omega[0] + omega[1] * T;

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

  SolarSystem.prototype.update = function (t, dt) {

    let currentDate = moment(t + dt);
    let T = this._calculateJulianDate(currentDate);

    if (t + dt === this.lastTime)
      return;

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

      if (!planet.hasOwnProperty('lastMeanAnomaly')) {
        n = Math.sqrt(planet.u / Math.pow(a, 3));
      } else if (Math.sign(meanAnomaly) === Math.sign(planet.lastMeanAnomaly) ||
        Math.sign(meanAnomaly) >= 0) {
        n = (meanAnomaly - planet.lastMeanAnomaly) / ((t + dt - this.lastTime) / 1000);
      } else if (Math.sign(meanAnomaly) < 0) {
        n = (2 * Math.PI + meanAnomaly - planet.lastMeanAnomaly) / ((t + dt - this.lastTime) / 1000);
      }

      planet.averageAngularVelocity.add(n);
      n = planet.averageAngularVelocity.average();

      // Calculate time until periapsis
      let periapsisDelta, apoapsisDelta;

      if (meanAnomaly > 0) {
        periapsisDelta = (2 * Math.PI - meanAnomaly) / n;
        apoapsisDelta = (Math.PI - meanAnomaly) / n;
      } else if (meanAnomaly <= 0) {
        periapsisDelta = -meanAnomaly / n
        apoapsisDelta = (Math.PI + (-meanAnomaly)) / n;
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

      planet.lastMeanAnomaly = meanAnomaly;

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

    this.lastTime = t + dt;
  };

  function MovingAverage(size) {
    this.size = size;
    this.array = new Array(size);
    this.idx = 0;
  };

  MovingAverage.prototype.add = function (item) {
    this.array[this.idx++] = item;
    if (this.idx === this.size) idx = 0;
  };

  MovingAverage.prototype.average = function () {
    let sum = this.array.reduce(function (prev, cur) {
      return [prev[0] + cur, prev[1] + 1]
    }, [0, 0]);
    if (sum[1] === 0)
      return 0;

    return sum[0] / sum[1];
  };

  return SolarSystem;
});
