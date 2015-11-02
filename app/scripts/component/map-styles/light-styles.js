/**
 * Create a series of mapbox gl styles to use as a property-based color scale
 * for visualizing village lights
 *
 * @param {string} source - the source id
 * @param {string} sourceLayer - the layer in the source
 * @param {number} numStops - the number of colors in the scale
 */
function create (idPrefix, source, sourceLayer, numStops) {
  return (Array.apply(null, {length: numStops})).map((_, i) => ({
    id: idPrefix + i,
    type: 'symbol',
    source: source,
    'source-layer': sourceLayer,
    layout: {
      'icon-image': 'dot.sdf',
      'icon-size': {
        'base': 1,
        'stops': [ [1, 0.5], [4, 1], [8, 1], [9, 1.25], [10, 2], [12, 3] ]
      },
      'icon-allow-overlap': true,
      'visibility': 'visible'
    },
    paint: {
      'icon-color': '#efc20d',
      'icon-opacity': (i + 1) / numStops
    }
  }));
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
