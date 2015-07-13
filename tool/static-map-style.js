'use strict';

require('babel/register');
/*
 * Generate a static version of the map style for use with
 * GL editor (http://mapbox.com/app)
 */

let style = require('../app/scripts/component/map-styles/main.json');
let lightStyles = require('../app/scripts/component/map-styles/light-styles');

let lightLayers = lightStyles.create('lights', 'village-lights', '10percgeojson', 10);
let filters = [
  ['all', ['>=', '2013-12', 1], ['<', '2013-12', 2]],
  ['all', ['>=', '2013-12', 2], ['<', '2013-12', 5]],
  ['all', ['>=', '2013-12', 5], ['<', '2013-12', 6]],
  ['all', ['>=', '2013-12', 6], ['<', '2013-12', 7]],
  ['all', ['>=', '2013-12', 7], ['<', '2013-12', 8]],
  ['all', ['>=', '2013-12', 8], ['<', '2013-12', 9]],
  ['all', ['>=', '2013-12', 9], ['<', '2013-12', 10]],
  ['all', ['>=', '2013-12', 10], ['<', '2013-12', 20]],
  ['all', ['>=', '2013-12', 20], ['<', '2013-12', 30]],
  ['all', ['>=', '2013-12', 30], ['<', '2013-12', 65]]];

lightLayers.forEach(function (l) {
  l.filter = filters.shift();
});

style.layers.pop();
Array.prototype.push.apply(style.layers, lightLayers);

console.log(JSON.stringify(style));
