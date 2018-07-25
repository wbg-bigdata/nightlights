const d3 = require('d3');
const numeral = require('numeral');
const React = require('react');
const t = require('prop-types');
const classnames = require('classnames');
const debounce = require('lodash.debounce');
const assign = require('object-assign');
const Actions = require('../actions');
const LineChart = require('./line-chart');
const Legend = require('./legend');
const Loading = require('./loading');
const DateControl = require('./date-control');
const smooth = require('../lib/moving-average');
const {satelliteAdjustment} = require('../config');

/*
 * Data Accessor Functions
 */
function x (datum) { return datum.year + (datum.month - 1) / 12; }
function y (datum) { return +datum.smoothedMedian; }
function parseDate (d) {
  let year = ~~d;
  let month = ~~((d - year) * 12 + 1);
  return { year, month };
}
function formatDate (x) {
  let {year, month} = parseDate(x);
  return month + '/' + year;
}
let acc = (prop) => (d) => +d[prop];

const smoothedProp = {
  'vis_median': 'smoothedMedian',
  'quintile1': 'smoothedQuintile1',
  'quintile4': 'smoothedQuintile4'
};

function processSeries (values, doSmoothing) {
  let properties = Object.keys(smoothedProp);

  let averageCount = values.reduce((memo, x) => memo + x.count / values.length, 0);
  if (!isNaN(averageCount)) {
    values = values.filter((x) => x.count > (0.05 * averageCount));
  }

  // average satellite values
  values = d3.nest()
    .key(x)
    .sortKeys(d3.ascending)
    .rollup((values) => {
      let newValue = assign({}, values[0]);
      properties.forEach((prop) => {
        let fn = acc(prop);
        let val = d3.mean(values, (value) =>
          fn(value) - (satelliteAdjustment[value.satellite] || 0));
        newValue[prop] = val;
      });
      return newValue;
    })
    .entries(values)
    .map((entry) => entry.values);

  if (values.length > 0) {
    let smoothFn = doSmoothing ? smooth : (values, fn, prop) =>
      values.forEach((d) => { d[prop] = fn(d); });
    smoothFn(values, acc('vis_median'), 'smoothedMedian');
    smoothFn(values, acc('quintile1'), 'smoothedQuintile1');
    smoothFn(values, acc('quintile4'), 'smoothedQuintile4');
  }

  return values;
}

/**
 * Container view for the light curves plot.
 */
class LightCurves extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      timeSeries: {},
      villageCurves: {},
      region: {},
      data: null,
      centerline: null,
      series: [],
      scales: {x: d3.scale.linear(), y: d3.scale.linear()},
      domains: { x: [0, 0], y: [0, 0] },
      width: 0,
      height: 0,
      expanded: !!props.expanded
    };
    this.toggleCompareMode = this.toggleCompareMode.bind(this);
    this.toggle = this.toggle.bind(this);
    this.selectDate = this.selectDate.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount () {
    // capture initial height (presumably set in css)
    window.addEventListener('resize', this.handleResize);
    this._handleData(this.props);
    this.handleResize(this.state);

    Actions.toggleChartExpanded.listen(function () {
      this.setState({
        expanded: !this.state.expanded
      });

      // HACK: since we know that changing the `expanded` state will
      // cause a height change post-render, we trigger handleResize
      // to force a second call to render after the container has its
      // new height so that the line chart is rendered with the correct
      // height too
      setTimeout(this.handleResize);
    }.bind(this));
    // same as the above hack, but for toggling split screen mode
    Actions.toggleCompareMode.listen(function () {
      setTimeout(this.handleResize);
    }.bind(this));
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize () {
    const node = this.refs.node;
    this.setState(this._calcScales(Object.assign({}, this.state, {
      width: node.offsetWidth,
      height: node.offsetHeight
    })));
  }

  toggle (e) {
    if (e) { e.preventDefault(); }
    this.setState({ expanded: !this.state.expanded });
  }

  componentDidUpdate (prevProps, prevState) {
    const { expanded } = this.state;
    if (expanded !== prevState.expanded) {
      this.handleResize();
    }

    // TODO consider using getDerivedStateFromProps for this
    const { timeSeries, villageCurves, region } = this.props;
    if (!timeSeries.loading && prevProps.timeSeries.loading) {
      let nextState = this.processResults(false, timeSeries.results);
      // districts have centerlines
      if (region.district === timeSeries.adminName && !centerline) {
        nextState.centerline = processSeries(timeSeries.results, this.props.smoothing);
      } else if (!region.district && this.state.centerline) {
        nextState.centerline = null;
      }
      Object.assign(nextState, this._calcScales({
        margins: this.props.margins,
        width: this.state.width,
        height: this.state.height,
        data: nextState.data,
        centerline: nextState.centerline
      }));
      this.setState(nextState);
    }
  }

  processResults (isDistrict, _data) {
    // filter out Delhi, it totally screws up the scale
    const data = _data.filter(d => d.key !== 'delhi');
    // group the flat data per subregion
    const series = d3.nest().key(d => isDistrict ? d.villagecode : d.key)
    .entries(data);

    let processed = [];
    series.forEach(entry => {
      entry.values = processSeries(entry.values, this.props.smoothing);
      processed.push(...entry.values);
    });
    return { series, data: processed };
  }

  /*
   * Handle incoming data from the store: this method is responsible
   * for any processing and transforming of the incoming data that's
   * needed before rendering it.
   */
  _handleData () {
    let {timeSeries, villageCurves, region, margins, smoothing} = this.props;
    let {series, centerline, data, rawData} = this.state;

    // set this flag if we handle any new data, because in that case, we
    // need to recalculate scales.
    let shouldUpdateScales = false;

    // Deal with grouping the subregions' time series data
    let newData = region.district ? villageCurves.results : timeSeries.results;
    if (newData !== rawData) {
      // save this on the state for future comparisons
      rawData = newData;

      data = rawData || [];
      // filter out delhi, because it totally screws up the scale
      data = data.filter((datum) => datum.key !== 'delhi');

      // group the flat data per subregion
      series = d3.nest()
      .key((datum) =>
        region.level === 'district' ? datum.villagecode : datum.key)
      .entries(data);

      // transformations of the data: averageing multiple satellites in
      // same month, and smoothing with rolling average
      data = [];
      series.forEach((entry) => {
        entry.values = processSeries(entry.values, smoothing);
        Array.prototype.push.apply(data, entry.values);
      });

      shouldUpdateScales = true;
    }

    // Deal with district centerline
    let shouldProcess = region.district &&
      timeSeries.adminName === region.district &&
      (region.district !== this.props.region.district || !centerline);

    if (shouldProcess) {
      centerline = processSeries(timeSeries.results || [], smoothing);
      shouldUpdateScales = true;
    } else if (!region.district && centerline) {
      centerline = null;
    }

    let newScaleState = shouldUpdateScales
      ? this._calcScales({
        margins,
        width: this.state.width,
        height: this.state.height,
        data,
        centerline
      }) : {};

    this.setState(assign(newScaleState, {
      series, data, rawData, centerline
    }));
  }

  /*
   * Calculate scales based on data and width/height
   */
  _calcScales ({data, centerline, width, height}) {
    // set up scales
    const {margins} = this.props;
    const {expanded} = this.state;

    let allData = (data || []).concat(centerline || []);
    let ydata = [];
    if (data) {
      ydata = ydata.concat(data.map(y));
    }
    if (centerline) {
      ydata = ydata.concat(centerline.map(y));
      ydata = ydata.concat(centerline.map(acc('smoothedQuintile1')));
      ydata = ydata.concat(centerline.map(acc('smoothedQuintile4')));
    }

    // Bail out if we don't have any data, because we'll get NaN's in
    // this case.
    if (ydata.length === 0) {
      return {width, height};
    }

    let domainX = d3.extent(allData, x);
    let scaleX = d3.scale.linear()
      .domain(domainX)
      .range([margins.left, width - margins.right])
      .clamp(true);

    let domainY = d3.extent(ydata);

    // TODO: remove these hacked y limits.  We're including them right now
    // as a stopgap to make the updated data we're using for the WB demo
    // look okay
    if (!centerline) {
      domainY[1] = Math.min(15, domainY[1]);
    }
    if (expanded) {
      domainY[1] = Math.max(10, domainY[1]);
    }

    let scaleY = d3.scale.linear()
      .domain(domainY)
      .range([height - margins.top, margins.bottom]);

    console.log(domainY.join(','), height, this.props.compareMode);
    return {
      scales: { x: scaleX, y: scaleY },
      domains: { x: domainX, y: domainY },
      width,
      height
    };
  }

  toggle (e) {
    if (e) { e.preventDefault(); }
    Actions.toggleChartExpanded();
  }

  toggleCompareMode (e) {
    if (e) { e.preventDefault(); }
    Actions.toggleCompareMode();
  }

  selectDate ([date]) {
    this.props.onChangeDate(parseDate(date));
  }

  render () {
    const {
      timeSeries,
      villageCurves,
      villages,
      region,
      margins
    } = this.props;

    const {
      series,
      centerline,
      scales,
      domains,
      width,
      height,
      expanded
    } = this.state;

    let errors = [timeSeries, region, villageCurves]
      .filter((s) => s.error)
      .map((s) => s.error);
    let loading = errors.length > 0 ||
      timeSeries.loading ||
      region.loading ||
      (region.district && villageCurves.loading);

    // village count
    let date = `${this.props.year}.${this.props.month}`;
    let features = !villages[date] || villages[date].loading
      ? [] : villages[date].data.features;
    let rggvy = features
      .filter((feat) => feat.properties.energ_date)
      .map((feat) => feat.properties.key);
    let allVillages = features.map((feat) => feat.properties.key);
    let highlightButton = region.district && rggvy.length ? (
      <a className='bttn-select-rggvy'
        onClick={function () { Actions.toggleRggvy(); }}>
        <div>{this.props.rggvyFocus ? 'Show All' : 'Highlight'}</div>
      </a>
    ) : '';

    // region median
    let median;
    if (!timeSeries.loading && !timeSeries.error && region.level !== 'nation') {
      let nowData = timeSeries.results.filter((d) =>
        +d.year === +this.props.year && +d.month === +this.props.month && d.key === region.key);
      median = d3.mean(nowData, (d) => d.vis_median);
      median = numeral(median).format('0.00');
    }

    let markers = [ ];
    let onCursorClick;
    if (this.props.year && this.props.month) {
      markers.push({
        className: 'current',
        year: +this.props.year,
        month: +this.props.month
      });
      onCursorClick = this.selectDate.bind(this);
    }

    let legend = this.props.legend || <Legend admin={region.level} />;
    let envelope = this.props.showCenterlineEnvelope ? [
      acc('smoothedQuintile1'),
      acc('smoothedQuintile4')
    ] : undefined;

    return (<div ref='node' className={classnames('container-light-curves', {expanded})}>
      <div className={classnames('light-curves', region.level)}>
        <div className='now-showing'>
          <DateControl year={this.props.year} month={this.props.month}
            interval={this.props.interval}
            region={region}
            onChangeDate={this.props.onChangeDate}
          />
          {this.props.compareMode === false
            ? <a href='#' className='bttn-compare clearfix'
              onClick={this.toggleCompareMode}>Compare Points in Time</a>
            : ''}
          {this.props.compareMode === 'left'
            ? <a href='#' className='bttn-compare clearfix'
              onClick={this.toggleCompareMode}>Hide Comparison</a>
            : ''}

          {this.props.compareMode !== 'left'
            ? <a href='#' className='bttn-expand' onClick={this.toggle}><span>Expand/Collapse</span></a>
            : ''}

          <ul className='spane-details'>
            {median ? (
              <li>
                <h5 className='spane-details-title' key='median-label'>Median Light Output</h5>
                <span className='spane-details-description' key='median-value'>{median}</span>
              </li>
            ) : null}
            {region.district && allVillages.length ? (
              <li>
                <h5 className='spane-details-title'>Villages in Electification Program
                  (<Link to='story' params={{story: 'rggvy'}}>?</Link>)
                </h5>
                <span className='spane-details-description'>{rggvy.length} / {allVillages.length} {highlightButton}</span>
              </li>
            ) : null}
          </ul>
        </div>

        {loading ? <Loading message={region.loadingMessage} errors={errors} />
        : <svg style={{width, height}}>

          <g transform={`translate(${margins.left}, ${margins.top})`}
            className='data-availability'>
          </g>

          <LineChart
            Actions={Actions}
            series={series}
            center={centerline}
            envelope={envelope}
            showSeriesEnvelopes={this.props.showAllEnvelopes}
            x={{
              value: x,
              format: formatDate,
              scale: scales.x,
              domain: domains.x
            }}
            y={{
              value: y,
              format: Math.round.bind(Math),
              scale: scales.y,
              domain: domains.y
            }}
            markers={markers}
            markerClass={function (m) { return m.className || ''; }}
            emphasized={region.emphasized || []}
            margins={margins}
            onCursorClick={onCursorClick} />

          <g className='legend' transform={`translate(${scales.x(0)}, ${height - 32})`}>
            {this.props.compareMode === 'right' ? false : legend}
          </g>
        </svg>
        }
      </div>
    </div>);
  }
}

LightCurves.propTypes = {
  year: t.number,
  month: t.number,
  interval: t.string,
  compareMode: t.oneOf(['left', 'right', false]),
  onChangeDate: t.func,
  timeSeries: t.object,
  villages: t.object,
  villageCurves: t.object,
  rggvyFocus: t.bool,
  margins: t.object,
  region: t.object,
  expanded: t.bool,
  showCenterlineEnvelope: t.bool,
  showAllEnvelopes: t.bool,
  smoothing: t.bool,
  legend: t.node
};
LightCurves.defaultProps = {
  showCenterlineEnvelope: true,
  showAllEnvelopes: false,
  smoothing: true
};
LightCurves.x = x;
LightCurves.y = y;
LightCurves.formatDate = formatDate;
LightCurves.parseDate = parseDate;

module.exports = LightCurves;
