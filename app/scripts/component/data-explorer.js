let React = require('react');
let Router = require('react-router');
let titlecase = require('titlecase');
let numeral = require('numeral');
let classnames = require('classnames');
let TimeSeriesStore = require('../store/time-series');
let VillageStore = require('../store/village');
let VillageCurveStore = require('../store/village-curve');
let RegionStore = require('../store/region');
let Search = require('./search');
let VillageDetail = require('./village-detail');
let LightMap = require('./light-map');
let LightCurves = require('./light-curves');
let Modal = require('./modal');
let NoData = require('./no-data');
let Actions = require('../actions');
let timespan = require('../lib/timespan');
let syncMaps = require('../lib/sync-maps');
let config = require('../config');
let dataThreshold = config.dataThreshold;
let welcomeText = config.welcome;

/**
 * The data explorer.  This is basically a wrapper for the:
 *
 *  - GLMap
 *  - No data indicator
 *  - RegionDetail (info box)
 *  - ChartBox (light curves)
 */
let DataExplorer = React.createClass({
  displayName: 'DataExplorer',
  propTypes: {
    params: React.PropTypes.object
  },

  mixins: [ Router.State ],

  statics: {
    willTransitionTo: function (transition, params, query) {
      let valid = timespan.getValid(params);
      if (+valid.year !== +params.year || +valid.month !== +params.month) {
        // TODO: redirect to the desired region.  The problem is that
        // because of how react-router works, we don't actually know which
        // route was being attempted at this point.
        transition.redirect('nation', valid, {});
      }
      RegionStore.setRegion(params, query);
      VillageCurveStore.setSelectedVillages(query.v || []);
    }
  },

  getInitialState () {
    return {
      region: RegionStore.getInitialState(),
      timeSeries: TimeSeriesStore.getInitialState(),
      villages: VillageStore.getInitialState(),
      villageCurves: VillageCurveStore.getInitialState()
    };
  },

  componentWillMount () {
    this.maps = [];
  },

  componentDidMount () {
    this.unsubscribe = [];
    this.unsubscribe.push(RegionStore.listen(this.onRegion));
    this.unsubscribe.push(VillageStore.listen(this.onVillages));
    this.unsubscribe.push(VillageCurveStore.listen(this.onVillageCurves));
    this.unsubscribe.push(TimeSeriesStore.listen(this.onTimeSeries));
    this.unsubscribe.push(Actions.toggleRggvy.listen(this.onToggleRggvy));
    // HACK: willTransitionTo is not getting called when _just_ the query param
    // changes, so we have to listen for that case specially
    this.unsubscribe.push(Actions.selectDate.listen(function ({compare}) {
      if (typeof compare !== 'undefined') {
        setTimeout(function () {
          RegionStore.setRegion(this.getParams(), this.getQuery());
        }.bind(this));
      }
    }.bind(this)));
  },

  componentWillUnmount () {
    this.unsubscribe.forEach((unsub) => unsub());
  },

  onRegion (regionState) {
    this.setState({region: regionState});
  },

  onVillages (villages) {
    this.setState({villages});
  },

  onVillageCurves (villageCurves) {
    this.setState({villageCurves});
  },

  onTimeSeries (timeSeries) {
    this.setState({timeSeries});
  },

  onToggleRggvy () {
    this.setState({rggvyFocus: !this.state.rggvyFocus});
  },

  onChangeDate (params) {
    Actions.selectDate(params);
  },

  onChangeCompareDate (params) {
    Actions.selectDate(Object.assign({compare: true}, params));
  },

  onMapCreated (map) {
    this.maps.push(map);
    if (this.maps.length === 2) {
      syncMaps(this.maps[0], this.maps[1]);
    }
    return function () {
      var i = this.maps.indexOf(map);
      if (i >= 0) { this.maps.splice(i, 1); }
      map.remove();
    }.bind(this);
  },

  hasNoData (region, villages, year, month) {
    // Decide if we need to show the no-data indicator.
    let noData = false;
    let date = `${year}.${month}`;
    if (!region.district && region.count) {
      let count = region.count.filter((a) => a.month === month && a.year === year)[0];
      // If count is not present, assume there are no readings for this month.
      // Otherwise, check if count is below the threshold which we call data.
      if (count === undefined || (
        count !== undefined && count.hasOwnProperty('count') && count.count < dataThreshold)) {
        noData = true;
      }
    } else if (region.district && villages[date] && !villages[date].loading) {
      noData = villages[date].data.features.length === 0;
    }

    return noData;
  },

  render () {
    let {region, timeSeries, villages, villageCurves} = this.state;
    // get year and month from router params
    let { year, month, interval } = this.getParams();
    year = +year;
    month = +month;
    let date = `${year}.${month}`;

    let query = this.getQuery();
    let compare;
    if (query.compare) {
      var [cy, cm] = query.compare.split('.');
      compare = { year: cy, month: cm };
    }

    // search & breadcrumbs
    let {
      level,
      properties,
      loading
    } = region;
    level = level || 'nation';
    properties = properties || {};
    // region name for search box
    let name = loading ? '' : properties.name;
    if (!loading && level === 'district') {
      let state = region.state;
      name = state.replace(/-/g, ' ') + ' / ' + name;
    }
    name = titlecase(name.toLowerCase());
    // population
    let population = 'Unknown';
    if (!isNaN(properties.tot_pop)) {
      population = numeral(properties.tot_pop).format('0,0');
    }

    // villages
    let hasRggvyVillages = !villages[date] || villages[date].loading
      ? false
      : villages[date].data.features.filter((feat) => feat.properties.energ_date).length > 0;
    let selectedVillages = villageCurves.loading ? [] : villageCurves.villages;
    let selectedVillageNames = selectedVillages;
    if (villages && villages[date] && villages[date].data) {
      let features = villages[date].data.features;
      selectedVillageNames = selectedVillages
        .map((v) => [v, features.filter((f) => f.properties.key === v)])
        .map(([v, names]) => names.length ? names[0].properties.name : v);
    }

    return (
      <div className={classnames('data-container', { compare: !!compare })}>
        <VillageDetail
          region={region}
          villages={selectedVillages}
          villageNames={selectedVillageNames}
          hasRggvyVillages={hasRggvyVillages}
        />
        <section className='spane region-detail'>
          <ul>
            <li className='breadcrumbs'><a href="#">Region</a></li>
            <li className='breadcrumbs'>Region 2</li>
          </ul>
          <div className='spane-header'>
            <h1 className='spane-title'>{name}</h1>
            <a className='bttn-clear-map'>
              <span>Clear out input box</span>
            </a>
            <a className='bttn-center-map'
              onClick={Actions.recenterMap}
              title='Zoom to location bounds'>
              <span>Zoom to location bounds</span>
            </a>
            <Search initialValue={name} />
          </div>
          <div className='spane-body'>
            <dl className='spane-details'>
              <dt>Population (census 2011)</dt>
              <dd>{population}</dd>
            </dl>
          </div>
        </section>
        <LightMap time={{year, month}} rggvyFocus={this.state.rggvyFocus}
          compareMode={compare ? 'left' : false}
          onMapCreated={this.onMapCreated} />
        {compare
          ? <LightMap time={compare} rggvyFocus={this.state.rggvyFocus}
            compareMode={'right'}
            onMapCreated={this.onMapCreated} />
          : ''}
        <LightCurves
          year={year}
          month={month}
          interval={interval}
          compareMode={compare ? 'left' : false}
          onChangeDate={this.onChangeDate}
          timeSeries={timeSeries}
          villages={villages}
          rggvyFocus={this.state.rggvyFocus}
          villageCurves={villageCurves}
          smoothing
          region={region}
          margins={{left: 36, right: 36, top: 70, bottom: 48}}
        />
        {compare
          ? <LightCurves
            year={compare.year}
            month={compare.month}
            interval={interval}
            compareMode={'right'}
            onChangeDate={this.onChangeCompareDate}
            timeSeries={timeSeries}
            villages={villages}
            rggvyFocus={this.state.rggvyFocus}
            villageCurves={villageCurves}
            smoothing
            region={region}
            margins={{left: 36, right: 36, top: 48, bottom: 48}}
            />
          : ''
        }
        <NoData noData={this.hasNoData(region, villages, year, month)} />
        <Modal
          isOn
          content={welcomeText}
          cookieKey='welcomeModalHasPlayed'
        />
      </div>
    );
  }
});

module.exports = DataExplorer;
