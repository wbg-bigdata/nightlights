'use strict';

module.exports.inflight = function (state) {
  return Object.assign({}, state, {loading: true});
}

module.exports.failed = function (state, action) {
  return Object.assign({}, state, {loading: false, error: action.error, rawResponse: action.rawResponse});
}

module.exports.success = function (state, action) {
  return Object.assign({}, state, {loading: false, error: null, results: action.results, initialLoad: true});
}
