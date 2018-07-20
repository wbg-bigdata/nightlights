'use strict';
const topojson = require('topojson');
const { combineReducers } = require('redux');
const { inflight, failed, success } = require('./util');
let sampleCount = require('../../data/sample-counts.json');

const initialState = {
  loading: false,
  emphasized: []
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
      state = Object.assign({}, state, parseResponse(action));
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
      district: context.district,
      loading: false,
    }
  }
}

module.exports = combineReducers({boundaries});
