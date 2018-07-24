var Reflux = require('reflux');
let queue = require('queue-async');
var url = require('url');

let ajax = require('./lib/ajax');
let { apiUrl, interval } = require('./config');

/**
 * Models the actions that the user can take.  `Reflux.createActions`
 * makes an object with the given named properties, where each property
 * is:
 *  - a function that can be called from within UI components, 'triggering'
 *    the action event.
 *  - an event emitter (not the offical Node one) that can be listened by
 *    the high-level routing logic or the `stores` that manage application
 *    state.
 *
 *  E.g., in a view component:
 *  var Actions = require('actions');
 *  Actions.chooseRegion();
 *
 *  In the routing logic:
 *  Actions.chooseRegion.listen(handler);
 */
module.exports = Reflux.createActions({
  'chooseRegion': {},
  'emphasize': {},
  'select': {},
  'selectParent': {},
  'selectDate': {},
  'selectVillages': {},
  'unselectVillages': {},
  'recenterMap': {},
  'toggleRggvy': {},
  'toggleChartExpanded': {},
  'toggleCompareMode': {}
});

const inflight = (action) => action + '-inflight';
const failed = (action) => action + '-failed';
const success = (action) => action + '-success';
const request = (options, action, context) => {
  return (dispatch) => {
    dispatch({type: inflight(action), context});
    ajax(options, (err, results) => {
      if (err) {
        dispatch(Object.assign({type: failed(action)}, err, context));
      } else {
        dispatch({type: success(action), results, context});
      }
    });
  };
}

function getLevel ({state, district}) {
  return state ? (district ? 'district' : 'state') : 'nation';
}

module.exports.queryRegionBoundaries = function (params) {
  const {state, district} = params;
  const level = getLevel(params);
  const key = level === 'nation' ? null : params[level];
  const boundariesApi = (
    level === 'nation' ?  url.resolve(apiUrl, 'boundaries/states') :
    level === 'state' ? url.resolve(apiUrl, 'boundaries/states/' + key) :
    url.resolve(apiUrl, 'boundaries/districts/' + key)
  );
  const action = 'query-region-boundaries';
  return request({url: boundariesApi}, action, {level, key, state, district});
}

module.exports.emphasize = function (keys) {
  return {type: 'emphasize', keys};
}

module.exports.queryRegionTimeseries = function (params) {
  const {state, district} = params;
  let timeseriesPath = ['months', interval];
  let adminType = 'nation';
  let adminName = 'india';
  if (!state) {
    timeseriesPath.push('states');
  } else if (!district) {
    timeseriesPath.push('states', state, 'districts');
    adminType = 'state';
    adminName = state;
  } else {
    timeseriesPath.push('districts', district);
    adminType = 'district';
    adminName = district;
  }
  const timeseriesApi = url.resolve(apiUrl, timeseriesPath.join('/'));
  const action = `query-region-timeseries`;

  return (dispatch) => {
    dispatch({type: inflight(action)});
    const q = queue();
    q.defer(ajax, {url: timeseriesApi});
    // if this is a state, then grab the state time series line as well.
    if (adminType === 'state') {
      q.defer(ajax, {url: timeseriesPath.slice(0, -1).join('/')});
    }
    q.await((err, results, stateResults) => {
      if (err) {
        return dispatch(Object.assign({type: failed(action)}, err));
      }
      if (stateResults) {
        results = results.concat(stateResults);
      }
      return dispatch({type: success(action), results, context: {
        adminType, adminName, interval, url: timeseriesApi
      }});
    });
  };
}

module.exports.clearVillageDistricts = function (keep) {
  return {type: 'clear-village-districts', keep};
}

module.exports.queryVillageDistrict = function ({district, year, month}) {
  const date = year + '.' + month;
  const path = `districts/${district}/villages?month=${date}`;
  const villageApi = url.resolve(apiUrl, path);
  const action = 'query-village-district';
  return request({url: villageApi}, action, {date});
}
