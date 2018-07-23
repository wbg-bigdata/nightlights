const React = require('react');
const t = require('prop-types');
const d3 = require('d3');
const compose = require('../lib/compose');
const Line = require('./line');
const Axis = require('./axis');
const LineMarker = require('./line-marker');

class LineChart extends React.Component {
  constructor (props) {
    super(props);
    this.state = { x: {}, y: {} };
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  componentDidMount () {
    this.updateScales(this.props);
  }

  componentWillReceiveProps (newProps) {
    this.updateScales(newProps);
  }

  updateScales ({x, y}) {
    let shouldUpdate = this.state.x.value !== x.value ||
      this.state.x.scale !== x.scale ||
      this.state.y.value !== y.value ||
      this.state.y.scale !== y.scale;

    if (shouldUpdate) {
      this.setState({
        x, y,
        xValue: compose(x.scale)(x.value),
        yValue: compose(y.scale)(y.value)
      });
    }
  }

  onMouseMove () {
    const sx = this.props.x.scale;
    const sy = this.props.y.scale;
    const [renderX, renderY] = d3.mouse(d3.select(this.refs.node));
    const x = sx.invert(renderX);
    const y = sy.invert(renderY);

    if (this.props.onCursorClick) {
      this.setState({ cursor: {
        dataCoordinates: [x, y],
        renderCoordinates: [sx(x), sy(y)]
      } });
    }
  }

  onClick () {
    if (typeof this.props.onCursorClick === 'function') {
      this.props.onCursorClick(this.state.cursor.dataCoordinates);
    }
  }

  render () {
    let {
      series,
      x,
      y,
      markers,
      markerClass,
      Actions,
      emphasized,
      showSeriesEnvelopes
    } = this.props;

    console.log(this.props);
    if (!x.scale || !y.scale) return null;

    let {
      cursor
    } = this.state;

    let markerValues = markers.map(x.value);
    let markerLocations = markerValues.map(x.scale);
    let markerClasses = markers
      .map(markerClass ? markerClass : () => '')
      .map((klass) => 'marker ' + klass);

    if (cursor) {
      markerValues.push(cursor.dataCoordinates[0]);
      markerLocations.push(cursor.renderCoordinates[0]);
      markerClasses.push('marker cursor');
    }

    let ticks = x.scale.ticks(5);
    markerValues.push.apply(markerValues, ticks);
    markerLocations.push.apply(markerLocations, ticks.map(x.scale));
    markerClasses.push.apply(markerClasses, ticks.map(t => 'tick'));

    let envelope;
    if (this.props.envelope) {
      envelope = this.props.envelope.map((fn) => compose(y.scale)(fn));
    }

    return (
      <g ref='node' onClick={this.onClick} onMouseMove={this.onMouseMove}>
        <rect className='mouse-catcher'
          style={{fill: 'rgba(0,0,0,.01)'}}
          x={0} y={0} width={10000} height={10000} />

        <LineMarker locations={markerLocations}
          classes={markerClasses}
          y1={y.scale(y.domain[0])}
          y2={y.scale(y.domain[1])}
        />

        { this.props.center ? (
          <g className='center'>
            <Line seriesKey='center' data={this.props.center}
              x={this.state.xValue}
              y={this.state.yValue}
              envelope={envelope} />
          </g>
        ) : null }

        <g className='lines'>
          {series.map((entry) =>
            <Line
              Actions={Actions}
              key={entry.key}
              seriesKey={entry.key}
              data={entry.values}
              x={this.state.xValue}
              y={this.state.yValue}
              envelope={showSeriesEnvelopes ? envelope : undefined}
              emphasized={false}
              />
          )}
        </g>

        <g className='lines emphasized'>
          {series
          .filter((entry) => emphasized.indexOf(entry.key) >= 0)
          .map((entry) =>
            <Line
              Actions={Actions}
              key={entry.key}
              seriesKey={entry.key}
              data={entry.values}
              x={this.state.xValue}
              y={this.state.yValue}
              emphasized={true}
              />
          )}
        </g>

        <g className='legend' transform={`translate(${x.scale(0)},12)`}>
          {this.props.legend || []}
        </g>

        <g transform={`translate(${x.scale(0)},0)`}>
          <Axis orientation='vertical'
            scale={y.scale}
            domain={y.domain}
            format={y.format}
            ticks={y.scale.ticks(8)}
          />
        </g>

        <g transform={`translate(0,${y.scale(0)})`}>
          <Axis orientation='horizontal'
            scale={x.scale}
            domain={x.domain}
            format={x.format}
            labelOffset={y.scale(y.domain[0]) - y.scale(0)}
            ticks={markerValues}
            tickClasses={markerClasses}
          />
        </g>

      </g>
    );
  }
}

LineChart.displayName = 'LineChart';

LineChart.propTypes = {
  Actions: t.object,
  series: t.array.isRequired,
  center: t.array,
  envelope: t.array,
  x: t.object.isRequired,
  y: t.object.isRequired,
  markers: t.array,
  markerClass: t.func,
  emphasized: t.array,
  onCursorClick: t.func,
  legend: t.node,
  showSeriesEnvelopes: t.bool
};

module.exports = LineChart;
