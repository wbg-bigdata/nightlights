let React = require('react');

class Legend extends React.Component {
  render () {
    let admin = this.props.admin;
    if (admin === 'district') {
      return (
        <g>
          <line className='line legend-line' x1='0' x2='20' y1='6' y2='6' />
          <text x='25' y='10'>district median light output</text>

          <rect className='envelope legend-envelope' x='200' y='0' width='25' height='12' />
          <text x='230' y='10'>district 20-80 percentile</text>

          <line className='line village-line' x1='380' x2='400' y1='6' y2='6' />
          <text x='405' y='10'>selected villages</text>

        </g>
      );
    } else {
      let offset = 0;
      let lineType = 'states';
      if (admin === 'state') {
        lineType = 'districts';
        offset = 12;
      }
      let output = `${lineType} light output`;
      return (
        <g>
          <line className='line legend-line' x1='0' x2='20' y1='6' y2='6' />
          <text x='25' y='10'>{output}</text>
          <line className='line active' x1={145 + offset} x2={165 + offset} y1='6' y2='6' />
          <text x={170 + offset} y='10'>highlighted area</text>
        </g>
      );
    }
  }
}

Legend.displayName = 'Legend';

module.exports = Legend;
