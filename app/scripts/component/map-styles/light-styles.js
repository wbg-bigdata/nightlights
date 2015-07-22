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
        'icon-allow-overlap': true,
        'icon-max-size': '@village-size',
        'visibility': 'visible'
    },
    paint: {
      'icon-color': '#efc20d',
      'icon-size': '@village-size',
      'icon-opacity': i / numStops
    },
    'paint.district': {
      'icon-size': '@district-village-size'
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
