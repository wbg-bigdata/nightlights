let d3 = require('d3');
let React = require('react');
let classnames = require('classnames');
let debounce = require('lodash.debounce');
let assign = require('object-assign');
let Actions = require('../actions');
let LineChart = require('./line-chart');
let Legend = require('./legend');
let Loading = require('./loading');
let smooth = require('../lib/moving-average');
let {satelliteAdjustment} = require('../config');

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

  // average satellite values
  values = d3.nest()
    .key(x)
    .sortKeys(d3.ascending)
    .rollup((values) => {
      let newValue = assign({}, values[0]);
      properties.forEach((prop) => {
        let fn = acc(prop);
        let val = d3.mean(values, value =>
          fn(value) - (satelliteAdjustment[value.satellite] || 0));
        newValue[prop] = val;
      });
      return newValue;
    })
    .entries(values)
    .map((entry) => entry.values);

  if (values.length > 0) {
    let smoothFn = doSmoothing ? smooth : (values, fn, prop) =>
      values.forEach(d => d[prop] = fn(d));
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

  constructor ({expanded}) {
    super();
    this.state = {
      timeSeries: {},
      villageCurves: {},
      region: {},
      data: null,
      centerline: null,
      series: [],
      scales: {x: (x) => x, y: (x) => x},
      domains: { x: [0, 0], y: [0, 0] },
      width: 0,
      height: 0,
      expanded: !!expanded
    };
  }

  componentDidMount () {
    let self = this;

    // capture initial height (presumably set in css)
    let node = React.findDOMNode(self);
    self.setState({ height: node.offsetHeight });

    // mimick width: 100% using resize handler
    function handleResize () {
      let node = React.findDOMNode(self);
      self.setState(self._calcScales(assign({}, self.state, {
        width: node.offsetWidth,
        height: node.offsetHeight
      })));
    }

    this.handleResize = debounce(handleResize, 100);

    window.addEventListener('resize', this.handleResize);
    this._handleData(this.props);
    this.handleResize(this.state);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  componentWillReceiveProps (props) {
    let {expanded} = props;
    if (typeof expanded !== 'undefined' && this.state.expanded !== expanded) {
      this.toggle();
    }
    this._handleData(props);
  }

  /*
   * Handle incoming data from the store: this method is responsible
   * for any processing and transforming of the incoming data that's
   * needed before rendering it.
   */
  _handleData ({timeSeries, villageCurves, region, margins, smoothing}) {
    // If we're waiting for data, don't try doing any data processing.
    if (timeSeries.loading) { return; }

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

    let newScaleState = shouldUpdateScales ?
      this._calcScales({
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
    let {margins} = this.props;
    let {expanded} = this.state;

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

    return {
      scales: { x: scaleX, y: scaleY },
      domains: { x: domainX, y: domainY },
      width,
      height
    };
  }

  toggle (e) {
    if (e) { e.preventDefault(); }
    this.setState({
      expanded: !this.state.expanded
    });

    // HACK: since we know that changing the `expanded` state will
    // cause a height change post-render, we trigger handleResize
    // to force a second call to render after the container has its
    // new height so that the line chart is rendered with the correct
    // height too
    setTimeout(this.handleResize);
  }

  selectDate ([date]) {
    Actions.selectDate(parseDate(date));
  }

  render () {
    let {
      timeSeries,
      villageCurves,
      region,
      margins
    } = this.props;

    let {
      series,
      centerline,
      scales,
      domains,
      width,
      height,
      expanded
    } = this.state;

    let errors = [timeSeries, region, villageCurves]
      .filter(s => s.error)
      .map(s => s.error);
    let loading = errors.length > 0 ||
      timeSeries.loading ||
      region.loading ||
      (region.district && villageCurves.loading);

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

    let apiUrl = timeSeries ? timeSeries.url : 'http://api.nightlights.io/';

    return (
      <div className={classnames('light-curves', region.level, {expanded})}>
        {apiUrl ? <div className='api-url'>
          <a target='_blank' href={apiUrl}>JSON API: {apiUrl}</a>
        </div> : []}
        <a href='#' className='bttn-expand' onClick={this.toggle.bind(this)}><span>Expand/Collapse</span></a>

        {loading ? <Loading message={region.loadingMessage} errors={errors} /> :
        <svg style={{width, height}}>

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
            markerClass={(m) => m.className || ''}
            emphasized={region.emphasized || []}
            margins={margins}
            legend={legend}
            onCursorClick={onCursorClick} />
        </svg>
        }
      </div>
    );
  }
}

LightCurves.displayName = 'LightCurves';
LightCurves.propTypes = {
  year: React.PropTypes.number,
  month: React.PropTypes.number,
  timeSeries: React.PropTypes.object,
  villageCurves: React.PropTypes.object,
  margins: React.PropTypes.object,
  region: React.PropTypes.object,
  expanded: React.PropTypes.bool,
  showCenterlineEnvelope: React.PropTypes.bool,
  showAllEnvelopes: React.PropTypes.bool,
  smoothing: React.PropTypes.bool,
  legend: React.PropTypes.node
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
