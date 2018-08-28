'use strict';
const topojson = require('topojson');
const { combineReducers } = require('redux');
const { inflight, failed, success } = require('./util');
let sampleCount = require('../../data/sample-counts.json');

/**
 * Models app state relating to the current region of interest.
 *
 * @property {object} error - API or transport error.
 * @property {boolean} loading - true if waiting on any API response
 * @property {string} key - unique key
 * @property {string} name - display name
 * @property {string} level - 'nation', 'state', 'district'
 * @property {string} state - unique key of state; undefined if level === 'nation'
 * @property {string} district - unique key of district; undefined if irrelevant
 * @property {Geometry} boundary - GeoJSON boundary of current district
 * @property {object} subregions - an object that maps subregions' `key`s to
 * GeoJSON boundaries.  Used by the map component to highlight subregion
 * boundaries.
 * @property {array} emphasized - an array of keys of currently emphasized
 * regions.  Should be subregions of the current `region`.
 */

const initialState = {
  loading: true,
  initialLoad: false,
  level: 'nation',
  emphasized: [],
  selected: null
};

function boundaries (state = initialState, action) {
  switch (action.type) {
    case 'query-region-boundaries-inflight':
      state = inflight(state);
      break;
    case 'query-region-boundaries-failed':
      state = failed(state, action);
      break;
    case 'query-region-boundaries-success':
      state = Object.assign(success(state, action), parseResponse(action));
      break;
    case 'emphasize':
      state = Object.assign({}, state, emphasize(action, state));
    case 'select':
      state = Object.assign({}, state, {
        selected: action.key
      });
      break;
  }
  return state;
}

function parseResponse ({results, context}) {
  const {key, level} = context;
  let boundary, properties, subregions;
  if (key && results.objects[key]) {
    let fc = topojson.feature(results, results.objects[key]);
    boundary = fc.features[0].geometry;
    properties = fc.features[0].properties;
  }
  if (results.objects.subregions) {
    let fc = topojson.feature(results, results.objects.subregions);
    subregions = {};
    fc.features.forEach(feat => subregions[feat.properties.key] = feat);
    // Add up states' populations to get a total for the nation
    if (level === 'nation') {
      properties = {
        name: 'India',
        tot_pop: fc.features.reduce((memo, feat) =>
          memo + (+feat.properties.tot_pop), 0)
      };
    }
  }
  const admin = level === 'nation' ? 'nation' : key;
  const count = sampleCount.map(obj => obj.key === admin ? obj : null)
    .filter(Boolean);
  return {
    key,
    level,
    boundary,
    properties,
    subregions,
    count,
    state: context.state,
    district: context.district
  }
}

function emphasize ({keys}, {subregions, level}) {
  const _keys = Array.isArray(keys) ? keys : [keys];
  return {
    emphasized: _keys.filter(k => level === 'district' || !subregions || subregions[k])
  };
}

module.exports = combineReducers({boundaries});
