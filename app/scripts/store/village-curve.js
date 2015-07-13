var d3 = require('d3');
let url = require('url');
let Reflux = require('reflux');
let assign = require('object-assign');
let RegionStore = require('./region');
let ajax = require('../lib/ajax');
let apiUrl = require('../config').apiUrl;
let interval = require('../config').interval;

module.exports = Reflux.createStore({
  init () {
    this._district = null;
    this._villageCurves = {};
    this._state = {
      loading: false,
      results: this.flatVillages(),
      villages: Object.keys(this._villageCurves)
    };
    this.listenTo(RegionStore, this.onRegion.bind(this));
  },

  getInitialState () {
    return this._state;
  },

  setState (newState) {
    this._state = assign({}, this._state, newState);
    this.trigger(assign({}, this._state));
  },

  onRegion (region) {
    if (region.district !== this._district) {
      this._district = region.district;
      this._villageCurves = {};
      this.setState(this.getInitialState());
    }
  },

  // used to flatten _villageCurves before triggering change.
  // this is a little inefficient because whatever's downstream will have to
  // re-do this nesting, but not going to worry about it now.
  flatVillages () {
    var villages = this._villageCurves;
    var results = [];
    for (let village in villages) {
      Array.prototype.push.apply(results, villages[village]);
    }
    return results;
  },

  setSelectedVillages (villagecodes) {
    // delete any villages that are currently selected but not in the given list
    Object.keys(this._villageCurves).forEach(v =>
      villagecodes.indexOf(v) >= 0 || delete this._villageCurves[v]);

    // remove any villages that we already have data for.
    villagecodes = villagecodes.filter(v => !this._villageCurves[v]);

    if (villagecodes.length === 0) {
      this.setState({
        loading: false,
        results: this.flatVillages(),
        villages: Object.keys(this._villageCurves)
      });
      return;
    }

    this.setState({
      loading: true,
      results: this.flatVillages()
    });

    let codes = villagecodes.join(',');
    let path = `months/${interval}/villages/${codes}`;
    let api = url.resolve(apiUrl, path);
    let self = this;
    this._mostRecentRequest = api;
    ajax({ url: api }, function (err, result) {
      if (err) { return self.setState(err); }
      if (api !== self._mostRecentRequest) {
        console.log('discarding response from stale request', api);
        return;
      }

      // group the entries by their village code, then assign each entry
      // as an array property to _villageCurves.
      let results = d3.nest()
        .key((d) => d.villagecode)
        .entries(result);
      results.forEach((result) => self._villageCurves[result.key] = result.values);

      self.setState({
        loading: false,
        results: self.flatVillages(),
        villages: Object.keys(self._villageCurves)
      });
    });
  }
});
