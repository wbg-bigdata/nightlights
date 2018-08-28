const t = require('prop-types');

/**
 * A React PropType for use with lodash-style object accessors (string or
 * function)
 */
let AccessorType = t.oneOfType([
  t.func,
  t.string
]);

module.exports = AccessorType;
