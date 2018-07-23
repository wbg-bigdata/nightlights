'use strict';
const url = require('url');
const React = require('react');
const { connect } = require('react-redux');
const t = require('prop-types');
const d3 = require('d3');

const TimeSeriesStore = require('../store/time-series');
const VillageStore = require('../store/village');
const VillageCurveStore = require('../store/village-curve');
const RegionStore = require('../store/region');

const RegionDetail = require('./region-detail');
const VillageDetail = require('./village-detail');
const LightMap = require('./light-map');
const LightCurves = require('./light-curves');
const DateControl = require('./date-control');
const Modal = require('./modal');
const NoData = require('./no-data');
const Actions = require('../actions');
const timespan = require('../lib/timespan');
const { interval, dataThreshold, welcome: welcomeText } = require('../config');

const {
  queryRegionBoundaries,
  queryRegionTimeseries,
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
      villages: VillageStore.getInitialState(),
      villageCurves: VillageCurveStore.getInitialState()
    };
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
      VillageCurveStore.setSelectedVillages(query || []);
    }
  }

  onVillages (villages) {
    this.setState({villages});
  }

  onVillageCurves (villageCurves) {
    this.setState({villageCurves});
  }

  onToggleRggvy () {
    this.setState({rggvyFocus: !this.state.rggvyFocus});
  }

  render () {
    const { region, timeSeries } = this.props;
    let {villages, villageCurves} = this.state;
    // get year and month from router params
    let {year, month, interval } = this.props.match.params;
    year = +year;
    month = +month;

    // Decide if we need to show the no-data indicator.
    let noData = false;
    if (!region.district && region.count) {
      let count = region.count.filter((a) => a.month === month && a.year === year)[0];
      // If count is not present, assume there are no readings for this month.
      // Otherwise, check if count is below the threshold which we call data.
      if (count === undefined || (
        count !== undefined && count.hasOwnProperty('count') && count.count < dataThreshold)) {
        noData = true;
      }
    } else if (region.district && !villages.loading) {
      noData = villages.data.features.length === 0;
    }

    // region median
    let median;
    if (!timeSeries.loading && !timeSeries.error && region.level !== 'nation') {
      let nowData = timeSeries.results.filter(d =>
        +d.year === year && +d.month === month && d.key === region.key);
      median = d3.mean(nowData, d => d.vis_median);
    }

    // villages
    let rggvy = villages.loading ? [] : villages.data.features
      .filter(feat => feat.properties.energ_date)
      .map(feat => feat.properties.key);
    let allVillages = villages.loading ? [] : villages.data.features
      .map(feat => feat.properties.key);
    let selectedVillages = villageCurves.loading ? [] : villageCurves.villages;
    let selectedVillageNames = selectedVillages;
    if (this.state.villages && this.state.villages.data) {
      let features = this.state.villages.data.features;
      selectedVillageNames = selectedVillages
        .map(v => [v, features.filter(f => f.properties.key === v)])
        .map(([v, names]) => names.length ? names[0].properties.name : v);
    }

    return (
      <div className='data-container'>
        <div className='now-showing'>
          <DateControl
            year={year}
            month={month}
            interval={interval}
            region={region}
          />
          <VillageDetail
            region={region}
            villages={selectedVillages}
            villageNames={selectedVillageNames}
          />
        </div>
        <RegionDetail
          region={region}
          villages={allVillages}
          rggvyVillages={rggvy}
          rggvyFocus={this.state.rggvyFocus}
          selectedVillages={selectedVillages}
          regionMedian={median}
        />
        <LightMap
          time={{year, month}}
          rggvyFocus={this.state.rggvyFocus}
        />
        <LightCurves
          year={year}
          month={month}
          timeSeries={timeSeries}
          villageCurves={villageCurves}
          smoothing={true}
          region={region}
          margins={{left: 36, right: 36, top: 48, bottom: 48}}
        />
        <NoData
          noData={noData}
        />
        <Modal
          isOn={true}
          content={welcomeText}
          cookieKey='welcomeModalHasPlayed'
        />
      </div>
    );
  }
};

DataExplorer.propTypes = {
  match: t.object,
  location: t.object,

  queryRegionBoundaries: t.func,
  queryRegionTimeseries: t.func,

  region: t.object,
  timeSeries: t.object
}

const select = (state) => ({
  region: state.region.boundaries,
  timeSeries: state.timeSeries.months
});

const dispatch = {
  queryRegionBoundaries,
  queryRegionTimeseries,
}

module.exports = connect(select, dispatch)(DataExplorer);
