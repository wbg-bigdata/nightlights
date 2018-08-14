'use strict';
const { combineReducers } = require('redux');
const { inflight, failed, success } = require('./util');

const initialState = {};
function districts (state = initialState, action) {
  const date = action.context ? action.context.date : undefined;
  switch (action.type) {
    case 'clear-village-districts':
      state = clear(state, action.keep);
      break;
    case 'query-village-district-inflight':
      state = Object.assign({}, state);
      state[date] = inflight(state[date]);
      break;
    case 'query-village-district-failed':
      state = Object.assign({}, state);
      state[date] = failed(state[date], action);
      break;
    case 'query-village-district-success':
      state = Object.assign({}, state);
      state[date] = parse(success(state, action));
      break;
  }
  return state;
}

function clear (state, keep) {
  if (!keep) return {};
  let next = {};
  Object.keys(state).filter(k => keep.indexOf(k) >= 0).forEach(k => {
    next[k] = state[k];
  });
  return next;
}

function parse (state) {
  const { results } = state;
  state.data = {
    type: 'FeatureCollection',
    features: results.map(village => ({
      type: 'Feature',
      properties: {
        key: village.villagecode,
        name: village.name,
        vis_median: +village.vis_median,
        energ_date: village.energ_date,
        rggvy: (village.energ_date !== null)
      },
      geometry: {
        type: 'Point',
        coordinates: [village.longitude, village.latitude]
      }
    }))
  };
}

module.exports = combineReducers({districts});
