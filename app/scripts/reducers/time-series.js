'use strict';
const { combineReducers } = require('redux');
const { inflight, failed, success } = require('./util');

/**
 * @property {object} error - API or transport error.
 * @property {boolean} loading - true if waiting on any API response
 * @property {string} interval - time interval to show plot 'yyyy.mm-yyyy.mm'
 * @property {array} results - time series query results
 *
*/

const initialState = {
  loading: true,
  results: [],
};

function months (state = initialState, action) {
  switch (action.type) {
    case 'query-region-timeseries-inflight':
      state = inflight(state);
      break;
    case 'query-region-timeseries-failed':
      state = failed(state, action);
      break;
    case 'query-region-timeseries-success':
      state = Object.assign(success(state, action), action.context);
      break;
  }
  return state;
}

module.exports = combineReducers({ months });
