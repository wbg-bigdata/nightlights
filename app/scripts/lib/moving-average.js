let config = require('../config');
/**
 * Computes a moving average of series arr.map(accesor) and attaches it
 * as arr[...][property]
 *
 * TODO: the size of the window should really be a parameter, not taken from
 * the app config
 */
module.exports = function(arr, accessor, property) {
  property = property || 'movingAverage';

  // number of items to look ahead and behind.
  let distance = config.movingAverageWindow;

  // pre-fill an initial sum with values up to,
  // but not including the value $distance away.
  // ex. when distance = 2 and arr = [1, 1, 1, 1, 1], sum = 2.
  let initial = arr.slice(0, distance);
  let total = initial.length;
  let sum = total === 1 ? accessor(initial) :
    initial.reduce((a, b) => a + accessor(b), 0);

  let drop, add;
  let undef = undefined;

  let n = arr.length;
  let i = -1;

  while (++i < n) {

    // get the object that is $distance away, index-wise.
    // if it exists, increment sum by it's value,
    // and increment total by 1.
    add = arr[i+distance];
    if (add !== undef) {
      sum += accessor(add);
      total += 1;
    }

    // now drop the object that is $distance behind,
    // if it exists.
    drop = arr[i-distance-1];
    if (drop !== undef) {
      sum -= accessor(drop);
      total -= 1;
    }

    // calculates the average for this item.
    arr[i][property] = sum/total;

    // total should start at distance,
    // gradually climb to distance * 2 + 1,
    // then fall to distance at the end of the loop.
  }
};
