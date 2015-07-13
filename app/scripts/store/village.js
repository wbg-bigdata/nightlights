let url = require('url');
let Reflux = require('reflux');
let assign = require('object-assign');
let ajax = require('../lib/ajax');
let apiUrl = require('../config').apiUrl;

module.exports = Reflux.createStore({
  init () {
    this.clearState();
  },

  clearState () {
    this._state = {
      data: { type: 'FeatureCollection', features: [] },
      loading: false
    };
  },

  getInitialState () {
    return this._state;
  },

  setState (newState) {
    this._state = assign({}, this._state, newState);
    this.trigger(assign({}, this._state));
  },

  setDistrict ({district, year, month}) {
    if (!district) {
      this.clearState();
      return this.setState({});
    }

    let path = `districts/${district}/villages?month=${year}.${month}`;
    let api = url.resolve(apiUrl, path);
    let self = this;
    this._mostRecentRequest = api;
    this.setState({loading: true});
    ajax({ url: api }, function (err, result) {
      if (err) { return self.setState(err); }
      if (api !== self._mostRecentRequest) {
        return;
      }

      let data = {
        type: 'FeatureCollection',
        features: result.map((village) => ({
          type: 'Feature',
          properties: {
            key: village.villagecode,
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
        data,
        loading: false
      });
    });
  }
});
