let assign = require('object-assign');
/**
 * Create a series of mapbox gl styles to use as a property-based color scale
 * for visualizing village lights
 *
 * @param {number} numStops - the number of colors in the scale
 */
function create (baseStyle, idPrefix, layerProperties, numStops) {
  return (Array.apply(null, {length: numStops})).map(function (_, i) {
    let style = assign({}, baseStyle._layer, { id: idPrefix + i }, layerProperties);
    style.paint = assign({}, style.paint);
    assign(style.paint, {'circle-opacity': (i + 1) / numStops});
    return style;
  });
}

/**
 * Set the filter on the village lights styles according to the selected
 * and stop values for the given property
 */
function setFilters (map, idPrefix, stops, prop, filters) {
  forEach(idPrefix, stops, function (layer, stopMin, stopMax) {
    let filter = [
      'all',
      [ '>=', prop, stopMin ],
      [ '<', prop, stopMax ]
    ]
    .concat(filters || []);
    map.setFilter(layer, filter);
  });
}

/**
 * Iterate the style layers for a given prefix and array of stops.
 */
function forEach (idPrefix, stops, cb) {
  stops.forEach(function (stop, i) {
    cb(idPrefix + i, stops[i], (i < stops.length - 1) ? stops[i + 1] : 65);
  });
}

module.exports = {
  create,
  setFilters,
  forEach
};
