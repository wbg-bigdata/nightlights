const React = require('react');
const t = require('prop-types');
const classnames = require('classnames');

class Axis extends React.Component {
  render () {
    let {
      scale,
      ticks,
      tickClasses,
      domain,
      format,
      orientation,
      labelOffset
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
    ticks = ticks || [];
    tickClasses = tickClasses || ticks.map(t => '');

    return (
      <g className={classnames('axis', orientation)}>
        <line x1={x1} x2={x2} y1={y1} y2={y2} />
        {ticks
        .filter((tick, i) => tick + i !== 0)
        .map((tick) => {
          let mi = ticks.indexOf(tick);
          let klass = 'label ' + (mi >= 0 ? (tickClasses[mi] || '') : '');
          return (<text className={klass} key={tick}
            x={orientation === 'vertical' ? labelOffset - 5 : scale(tick)}
            y={orientation === 'vertical' ? scale(tick) : labelOffset }
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

Axis.propTypes = {
  scale: t.func.isRequired,
  domain: t.array.isRequired,
  orientation: t.string.isRequired,
  format: t.func,
  ticks: t.array,
  tickClasses: t.array,
  labelOffset: t.number
};

Axis.defaultProps = {
  labelOffset: 0
};

module.exports = Axis;
