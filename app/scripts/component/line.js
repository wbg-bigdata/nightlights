let React = require('react');
let d3 = require('d3');
let classnames = require('classnames');
let AccessorType = require('../lib/accessor-type');
let config = require('../config');

class Line extends React.Component {
  constructor (props) {
    super();
    this.state = {
      hover: false,
      data: [],
      linestring: 'M0 0'
    };
  }

  componentDidMount () {
    this.maybeUpdateLine(this.props);
  }

  componentWillReceiveProps (props) {
    this.maybeUpdateLine(props);
  }

  maybeUpdateLine ({x, y, data}) {
    if (data !== this.state.data || x !== this.props.x || y !== this.props.y) {
      let line = d3.svg.line().interpolate(config.interpolation).x(x).y(y);
      let linestring = line(data);
      this.setState({ data, linestring });
    }
  }

  _action (action) {
    if (this.props.Actions && this.props.Actions[action]) {
      this.props.Actions[action](this.props.seriesKey);
    }
  }

  render () {
    let linestring = this.state.linestring;
    let klass = classnames('line', {
      active: this.props.emphasized
    });

    let area, areaPath, areaKlass;
    if (this.props.envelope) {
      area = d3.svg.area()
        .interpolate(config.interpolation)
        .x(this.props.x)
        .y0(this.props.envelope[0])
        .y1(this.props.envelope[1]);
      areaPath = area(this.props.data);
      areaKlass = classnames('envelope', {
        active: this.props.emphasized
      });
    }
    return (
      <g>
        { areaPath ? <path className={areaKlass} d={areaPath} /> : <g></g> }
        <path className={klass}
          data-hook={this.props.seriesKey}
          onMouseEnter={this._action.bind(this, 'emphasize')}
          d={linestring} />
      </g>
    );
  }
}

Line.displayName = 'Line';
Line.propTypes = {
  Actions: React.PropTypes.object,
  seriesKey: React.PropTypes.string,
  data: React.PropTypes.array.isRequired,
  x: AccessorType.isRequired,
  y: AccessorType.isRequired,
  envelope: React.PropTypes.array,
  emphasized: React.PropTypes.bool
};

module.exports = Line;
