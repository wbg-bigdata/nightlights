let url = require('url');
let Reflux = require('reflux');
let assign = require('object-assign');
let ajax = require('../lib/ajax');
let apiUrl = require('../config').apiUrl;

module.exports = Reflux.createStore({
  init () {
    this._state = {};
  },

  clearState (keepKeys) {
    for (let k in this._state) {
      if (!keepKeys || keepKeys.indexOf(k) < 0) {
        delete this._state[k];
      }
    }
  },

  getInitialState () {
    return this._state;
  },

  setState (newState) {
    this._state = assign({}, this._state, newState);
    this.trigger(assign({}, this._state));
  },

  setDistrict ({district, year, month}, {compare}) {
    if (!district) {
      this.clearState();
      return this.setState({});
    }

    var date = year + '.' + month;
    this.clearState([date, compare].filter(Boolean));

    if (!this._state[date]) {
      this._state[date] = assign({}, this._state[date], { loading: true });
      this._fetch(district, date);
    }
    if (compare && !this._state[compare]) {
      this._state[compare] = assign({}, this._state[compare], { loading: true });
      this._fetch(district, compare);
    }

    // emit the loading state to listeners
    this.setState({});
  },

  _fetch (district, date) {
    let self = this;
    let path = `districts/${district}/villages?month=${date}`;
    let api = url.resolve(apiUrl, path);
    ajax({ url: api }, function (err, result) {
      if (err) { return self.setState({[date]: err}); }
      if (!self._state[date]) { return; }

      let data = {
        type: 'FeatureCollection',
        features: result.map((village) => ({
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
            coordinates: [ village.longitude, village.latitude ]
          }
        }))
      };

      self.setState({
        [date]: {
          data,
          loading: false
        }
      });
    });
  }
});
