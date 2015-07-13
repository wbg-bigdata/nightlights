let React = require('react');
let d3 = require('d3');
let classnames = require('classnames');
let AccessorType = require('../lib/accessor-type');

class Axis extends React.Component {
  render () {
    let {
      scale,
      markerTicks,
      markerClasses,
      domain,
      format,
      orientation
    } = this.props;

    let [x1, x2] = domain.map(scale);

    let y1 = 0;
    let y2 = 0;

    if (orientation === 'vertical') {
      y1 = x1;
      y2 = x2;
      x1 = 0;
      x2 = 0;
    }

    if (!format) { format = scale; }

    if (isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2) ||
      typeof scale.ticks !== 'function') {
      return <g></g>;
    }

    // ticks = standard ticks unioned with marker positions
    markerTicks = markerTicks || [];
    markerClasses = markerClasses || [];
    let ticks = d3.set(scale.ticks(5).concat(markerTicks))
      .values().map(Number);

    return (
      <g className={classnames('axis', orientation)}>
        <line x1={x1} x2={x2} y1={y1} y2={y2} />
        {ticks
        .filter((tick, i) => tick + i !== 0)
        .map((tick) => {
          let mi = markerTicks.indexOf(tick);
          let klass = 'label ' + (mi >= 0 ? markerClasses[mi] : '');
          return (<text className={klass} key={tick}
            x={orientation === 'vertical' ? -5 : scale(tick)}
            y={orientation === 'vertical' ? scale(tick) : 0}
            dy={orientation === 'vertical' ? 0 : '1em'}
            textAnchor={orientation === 'vertical' ? 'end' : 'middle'} >

            {format(tick)}

          </text>);
        }
        )}
      </g>
    );
  }
}

Axis.displayName = 'Axis';

Axis.propTypes = {
  scale: React.PropTypes.func.isRequired,
  domain: React.PropTypes.array.isRequired,
  orientation: React.PropTypes.string.isRequired,
  format: React.PropTypes.func,
  markerTicks: React.PropTypes.array,
  markerClasses: React.PropTypes.array
};

module.exports = Axis;
