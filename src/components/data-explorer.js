const url = require('url');
const React = require('react');
const titlecase = require('titlecase');
const numeral = require('numeral');
const classnames = require('classnames');
const { connect } = require('react-redux');
const t = require('prop-types');
const d3 = require('d3');

const TimeSeriesStore = require('../store/time-series');
const VillageStore = require('../store/village');
const VillageCurveStore = require('../store/village-curve');
const RegionStore = require('../store/region');

const Search = require('./search');
const VillageDetail = require('./village-detail');
const LightMap = require('./light-map');
const LightCurves = require('./light-curves');
const DateControl = require('./date-control');
const Modal = require('./modal');
const NoData = require('./no-data');
const Actions = require('../actions');
const timespan = require('../lib/timespan');
const { interval, dataThreshold, welcome: welcomeText } = require('../config');
const syncMaps = require('../lib/sync-maps');

const {
  queryRegionBoundaries,
  queryRegionTimeseries,
  clearVillageDistricts,
  queryVillageDistrict,
} = require('../actions');

/**
 * The data explorer.  This is basically a wrapper for the:
 *
 *  - GLMap
 *  - No data indicator
 *  - RegionDetail (info box)
 *  - ChartBox (light curves)
 */
class DataExplorer extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      villageCurves: VillageCurveStore.getInitialState()
    };
    this.maps = [];
  }

  componentDidMount () {
    this.updateOnUrlChange(this.props.match.params, this.props.location.search);
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.updateOnUrlChange(this.props.match.params, this.props.location.search);
    }
  }

  updateOnUrlChange (params, query) {
    const valid = timespan.getValid(params);
    if (+valid.year !== +params.year || +valid.month !== +params.month) {
      this.props.history.push(url.resolve('/nation', `${valid.year}/${valid.month}`));
    } else {
      // RegionStore.setRegion(params);
      this.props.queryRegionBoundaries(params);
      this.props.queryRegionTimeseries(params);
      if (params.district) {
        this.props.queryVillageDistrict(params);
      } else {
        this.props.clearVillageDistricts();
      }
      VillageCurveStore.setSelectedVillages(query || []);
    }
  }

  onVillageCurves (villageCurves) {
    this.setState({villageCurves});
  }

  onToggleRggvy () {
    this.setState({rggvyFocus: !this.state.rggvyFocus});
  }

  onChangeDate (params) {
    Actions.selectDate(params);
  }

  onChangeCompareDate (params) {
    Actions.selectDate(Object.assign({compare: true}, params));
  }

  onMapCreated (map) {
    /*
    this.maps.push(map);
    if (this.maps.length === 2) {
      syncMaps(this.maps[0], this.maps[1]);
    }
    return function () {
      var i = this.maps.indexOf(map);
      if (i >= 0) { this.maps.splice(i, 1); }
      map.remove();
    }.bind(this);
    */
  }

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
    // region median
    let median;
    if (!this.props.timeSeries.loading && !this.props.timeSeries.error && region.level !== 'nation') {
      let nowData = this.props.timeSeries.results.filter(d =>
        +d.year === year && +d.month === month && d.key === region.key);
      median = d3.mean(nowData, d => d.vis_median);
    }
  }

  selectParent (e) {
    e.preventDefault();
    Actions.selectParent();
  }

  selectNation (e) {
    e.preventDefault();
    Actions.select();
  }

  render () {
    const {region, timeSeries, villages} = this.props;
    let {villageCurves} = this.state;
    // get year and month from router params
    let { year, month, interval } = this.props.match.params;
    year = +year;
    month = +month;
    let date = `${year}.${month}`;

    let query = this.props.location.search;
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
    name = titlecase(name.toLowerCase());
    let stateName = titlecase((region.state || '').replace(/-/g, ' '));

    let breadcrumbs = [];
    if (level !== 'nation') {
      breadcrumbs.push(<a href='#' onClick={this.selectNation}>India</a>);
    }
    if (level === 'district') {
      breadcrumbs.push(<a href='#' onClick={this.selectParent}>{stateName}</a>);
    }
    breadcrumbs.push(
      <span><a className='bttn-center-map'
          onClick={Actions.recenterMap.bind(Actions)}
          title={'Recenter map on ' + name}>
            <span>{name}</span>
        </a>
      </span>
    );

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

    let apiUrl = timeSeries ? timeSeries.url : 'http://api.nightlights.io/';

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
            {breadcrumbs.map((b, i) => <li key={`breadcrumb-${i}`} className='breadcrumbs'>{b}</li>)}
          </ul>
          <div className='spane-header'>
            <h1 className='spane-title'>{name}</h1>
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
            margins={{left: 36, right: 36, top: 70, bottom: 48}}
            />
          : ''
        }
        <NoData noData={this.hasNoData(region, villages, year, month)} />
        <Modal
          isOn
          content={welcomeText}
          cookieKey='welcomeModalHasPlayed'
        />
      <div className='footer'>
        {apiUrl ? <div className='api-url'>
          <a target='_blank' href={apiUrl}>JSON API: {apiUrl}</a>
        </div> : []}
        <div className='attribution'>
          Map data and imagery © <a href='https://mapbox.com'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> © <a href='https://www.digitalglobe.com'>DigitalGlobe</a> © <a href='https://www.mlinfomap.com/'>MLInfomap</a>
        </div>
      </div>
      </div>
    );
  }
};

DataExplorer.propTypes = {
  match: t.object,
  location: t.object,

  queryRegionBoundaries: t.func,
  queryRegionTimeseries: t.func,
  clearVillageDistricts: t.func,
  queryVillageDistrict: t.func,

  region: t.object,
  timeSeries: t.object,
  villages: t.object
}

const select = (state) => ({
  region: state.region.boundaries,
  timeSeries: state.timeSeries.months,
  villages: state.village.districts
});

const dispatch = {
  queryRegionBoundaries,
  queryRegionTimeseries,
  clearVillageDistricts,
  queryVillageDistrict,
}

module.exports = connect(select, dispatch)(DataExplorer);
