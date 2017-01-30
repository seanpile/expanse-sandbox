export default function MovingAverage(size) {
  this.size = size;
  this.array = new Array(size);
  this.idx = 0;
}

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

MovingAverage.prototype.elements = function () {
  let items = [];
  let i = this.idx;
  do {
    if (this.array[i] !== undefined) {
      items.push(this.array[i]);
    }

    i = (i + 1) % this.size;
  }
  while (i != this.idx);

  return items;
}
