let uniq = require('uniq');

module.exports = {
  reloadSources,
  setFilterLazy
};

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
