'use strict';
const { combineReducers } = require('redux');
const region = require('./region');
const timeSeries = require('./time-series');
module.exports = combineReducers({
  region,
  timeSeries
})
