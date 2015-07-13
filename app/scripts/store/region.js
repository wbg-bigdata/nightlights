let url = require('url');
let Reflux = require('reflux');
let assign = require('object-assign');
let titlecase = require('titlecase');
let TimeSeriesStore = require('./time-series');
let VillageStore = require('./village');
let Actions = require('../actions');
let ajax = require('../lib/ajax');
let apiUrl = require('../config').apiUrl;
let sampleCount = require('../../data/sample-counts.json');

/**
 * Models app state relating to the current region of interest.
 * Triggers with a RegionState object
 *
 * @typedef RegionState
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
module.exports = Reflux.createStore({
  init () {
    this._region = {
      loading: true,
      emphasized: []
    };
    this.listenTo(Actions.emphasize, this.onEmphasize.bind(this));
  },

  getInitialState () {
    return this._region;
  },

  onEmphasize (key) {
    if (!Array.isArray(key)) { key = [key]; }
    this._region.emphasized = key;
    this.trigger(this._region);
  },

  setState (newState) {
    this._region = assign({}, this._region, newState);
    this.trigger(assign({}, this._region));
  },

  setRegion (params) {
    let {state, district} = params;
    let level = state ? (district ? 'district' : 'state') : 'nation';
    let key = params[level];

    let shouldSkipEndpoint = this._region.subregions &&
        level === this._region.level &&
        state === this._region.state &&
        district === this._region.district;

    let loadingMessage = 'Loading light curves';
    if (this._region.subregions
    && this._region.subregions[key]
    && this._region.subregions[key].properties) {
      let name = this._region.subregions[key].properties.name;
      loadingMessage += ' for ' + titlecase(name.toLowerCase());
    } else {
      loadingMessage += '.';
    }

    this.setState({ loading: true, loadingMessage, state, district, level });
    TimeSeriesStore.setRegion(params);
    VillageStore.setDistrict(params);

    if (shouldSkipEndpoint) {
      this.setState({ loading: false });
    } else {
      let boundariesApi;
      switch (level) {
        case 'nation':
          boundariesApi = url.resolve(apiUrl, 'boundaries/states');
          break;

        case 'state':
          boundariesApi = url.resolve(apiUrl, 'boundaries/states/' + key);
          break;

        case 'district':
          boundariesApi = url.resolve(apiUrl, 'boundaries/districts/' + key);
          break;
      }

      let self = this;
      self._mostRecentRequest = boundariesApi;
      ajax({ url: boundariesApi }, function (err, result) {
        if (err) { return self.trigger(err); }
        if (boundariesApi !== self._mostRecentRequest) {
          return;
        }

        let boundary, properties;
        if (key && result[key]) {
          boundary = result[key].geometry;
          properties = result[key].properties;
          delete result[key];
        }

        // Add up states' populations to get a total for the nation
        if (level === 'nation') {
          properties = {
            name: 'India',
            tot_pop: Object.keys(result).reduce((memo, feat) =>
              memo + (result[feat].properties || {}).tot_pop, 0)
          };
        }

        let admin = level === 'nation' ? 'nation' : key;

        var count = sampleCount.map((obj) => {
          return obj.key === admin ? obj : null;
        }).filter((a) => a);

        self.setState({
          key,
          properties,
          level,
          state,
          district,
          boundary,
          count,
          subregions: result,
          loading: false
        });
      });
    }
  }
});
