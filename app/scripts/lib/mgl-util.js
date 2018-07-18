let uniq = require('uniq');

module.exports = {
  reloadSources,
  setFilterLazy,
  showLayer
};

/**
 * Set the visibility of the given layer.
 */
function showLayer (map, layer, show) {
  let currentVisibility = map.getLayoutProperty(layer, 'visibility');
  if (show && currentVisibility !== 'visible') {
    map.setLayoutProperty(layer, 'visibility', 'visible');
  } else if (!show && currentVisibility === 'visible') {
    map.setLayoutProperty(layer, 'visibility', 'none');
  }
}

function reloadSources (map, sources) {
  try {
    map.style._broadcastLayers();
    uniq(sources).forEach((source) => map.style.sources[source].reload());
  } catch (e) {
    console.warn('Could not reload ' + sources.join(',') + ':' + e);
  }
}

function setFilterLazy (map, layer, filter) {
  layer = map.style.getReferentLayer(layer);
  layer.filter = filter;
  return layer.source;
}
