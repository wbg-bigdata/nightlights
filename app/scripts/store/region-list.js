let url = require('url');
let Reflux = require('reflux');
let ajax = require('../lib/ajax');
let apiUrl = require('../config').apiUrl;
let titlecase = require('titlecase');

module.exports = Reflux.createStore({
  init () {
    this._data = {
      regions: [{
        name: 'India',
        type: 'nation'
      }]
    };

    ajax({ url: url.resolve(apiUrl, 'districts') }, (err, result) => {
      if (err) { throw err; }
      result.regions = result.regions
        .filter(region => region.state_key);

      let states = {};
      result.regions.forEach(region => {
        if (!states[region.state_key]) {
          this._data.regions.push({
            name: region.state_name,
            key: region.state_key,
            type: 'state'
          });
          states[region.state_key] = true;
        }

        this._data.regions.push({
          name: region.state_name + ' - ' + region.district_name,
          key: region.district_key,
          type: 'district',
          state: region.state_key
        });
      });

      this._data.regions.forEach(r => r.name = tc(r.name));
      this.trigger(this._data);
    });
  },

  getInitialState () { return this._data; }
});

function tc (str) {
  return titlecase((str || '').toLowerCase());
}
