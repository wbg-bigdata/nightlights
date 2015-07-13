let React = require('react');

class LineMarker extends React.Component {
  constructor (props) {
    super();
  }

  render () {
    let {
      locations,
      classes,
      height
    } = this.props;

    return (
      <g className='markers'>
        {locations.map((loc, i) =>
          (<line key={loc} className={classes[i]}
            x1={loc} x2={loc}
            y1={height} y2={0}
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
  height: React.PropTypes.number.isRequired
};

module.exports = LineMarker;
