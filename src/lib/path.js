'use strict';
const path = require('path');

/*
 * Construct a working application path.
 * Nation path: /nation/:year/:month
 * State path:  /state/:state/:year/:month
 * district:    /state/:state/district/:district/:year/:month
 */

module.exports = function (year, month, state, district) {
  const date = `${year}/${month}`;
  const prefix = state && district ? path.join('/state', state, 'district', district) :
    state ? path.join('/state', state) :
    '/nation';
  return path.join(prefix, date);
}
