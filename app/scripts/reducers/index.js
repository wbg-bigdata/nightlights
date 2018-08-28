'use strict';
const { combineReducers } = require('redux');
const region = require('./region');
const timeSeries = require('./time-series');
const village = require('./village');
module.exports = combineReducers({
  region,
  timeSeries,
  village
})
