// Export Vector
export default function Vector(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

Vector.prototype.plus = function (other) {
  return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
};

Vector.prototype.times = function (factor) {
  return new Vector(this.x * factor, this.y * factor, this.z * factor);
};

Vector.prototype.magnitude = function (other) {
  if (!other) other = new Vector(0, 0, 0);

  return Math.sqrt(
    Math.pow(this.x - other.x, 2) +
    Math.pow(this.y - other.y, 2) +
    Math.pow(this.z - other.z, 2));
};

Vector.prototype.dot = function (other) {
  return this.x * other.x + this.y * other.y + this.z * other.z;
};

Vector.prototype.cross = function (other) {
  return new Vector(
    this.y * other.z - this.z * other.y,
    this.z * other.x - this.x * other.z,
    this.x * other.y - this.y * other.x);
};
