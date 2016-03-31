
// Based on https://github.com/mapbox/mapbox-gl-compare/blob/master/index.js
module.exports = function sync (a, b) {
  function a2b () {
    b.off('move', b2a);
    cp(a, b);
    b.on('move', b2a);
  }

  function b2a () {
    a.off('move', a2b);
    cp(b, a);
    a.on('move', a2b);
  }
  a.on('move', a2b);
  b.on('move', b2a);
};

function cp (a, b) {
  b.jumpTo({
    center: a.getCenter(),
    zoom: a.getZoom(),
    bearing: a.getBearing(),
    pitch: a.getPitch()
  });
}

