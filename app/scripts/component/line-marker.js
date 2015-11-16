let React = require('react');

class LineMarker extends React.Component {
  constructor (props) {
    super();
  }

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
  locations: React.PropTypes.array.isRequired,
  classes: React.PropTypes.array.isRequired,
  y1: React.PropTypes.number.isRequired,
  y2: React.PropTypes.number.isRequired
};

module.exports = LineMarker;
