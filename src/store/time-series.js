let url = require('url');
let Reflux = require('reflux');
let assign = require('object-assign');
let queue = require('queue-async');
let ajax = require('../lib/ajax');
let apiUrl = require('../config').apiUrl;
let interval = require('../config').interval;

/**
 * Models the application state.  `Reflux.createStore` makes a 'store' object
 * that view components can subscribe to.  The store's job is to publish updates
 * to the state based on user actions (see `/actions.js`).
 *
 * The store fires events with `this.trigger({ ... })`, and components
 * typically should listen for those events and use them to decide whether/how
 * to do a `setState`, thus prompting the component to render.
 *
 * @typedef TimeSeriesState
 * @property {object} error - API or transport error.
 * @property {boolean} loading - true if waiting on any API response
 * @property {string} interval - time interval to show plot 'yyyy.mm-yyyy.mm'
 * @property {array} results - time series query results
 *
*/
module.exports = Reflux.createStore({
  init () {
    this._state = {
      loading: true,
      results: []
    };
  },

  getInitialState () {
    return assign({}, this._state);
  },

  /**
   * Set the state and trigger.
   */
  setState (newState) {
    this._state = assign({}, this._state, newState);
    this.trigger(assign({}, this._state));
  },

  setRegion ({state, district}) {
    // setup the appropriate endpoint urls
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

    // do a quick check to see if we're requesting the data
    // that's already on the page
    if (adminType === this._state.adminType &&
        adminName === this._state.adminName &&
        interval === this._state.interval) {
      this.setState({
        loading: false
      });
    } else {
      // if it's different then query the api.
      let timeseriesApi = url.resolve(apiUrl, timeseriesPath.join('/'));
      let self = this;
      self.setState({ loading: true });
      self._mostRecentRequest = timeseriesApi;

      let q = queue();
      q.defer(ajax, { url: timeseriesApi });
      // if this is a state, then grab the state time series line as well.
      if (adminType === 'state') {
        let stateUrl = url.resolve(apiUrl, timeseriesPath.slice(0, -1).join('/'));
        q.defer(ajax, { url: stateUrl });
      }
      q.await(function (err, results, stateResults) {
        if (err) { return self.trigger(err); }
        if (timeseriesApi !== self._mostRecentRequest) { return; }
        if (stateResults) { results = results.concat(stateResults); }
        self.setState({
          error: null,
          interval: interval,
          loading: false,
          results,
          emphasized: [],
          adminType: adminType,
          adminName: adminName,
          url: timeseriesApi
        });
      });
    }
  }
});
