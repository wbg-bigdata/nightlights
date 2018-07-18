const React = require('react');
const t = require('prop-types');

class LineMarker extends React.Component {
  render () {
    let {
      locations,
      classes,
      y1,
      y2
    } = this.props;

    return (
      <g className='markers'>
        {locations.map((loc, i) =>
          (<line key={loc} className={classes[i]}
            x1={loc} x2={loc}
            y1={y1} y2={y2}
           />))
        }
      </g>
    );
  }
}

LineMarker.displayName = 'LineMarker';
LineMarker.propTypes = {
  locations: t.array.isRequired,
  classes: t.array.isRequired,
  y1: t.number.isRequired,
  y2: t.number.isRequired
};

module.exports = LineMarker;
