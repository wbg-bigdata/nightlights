let React = require('react');
let titlecase = require('titlecase');

class Tooltip extends React.Component {
  render () {
    let {region} = this.props;

    let name = '';
    if (!region.loading && region.emphasized && region.emphasized.length > 0) {
      if (region.level === 'district') {
        name = 'Census codes: ' + region.emphasized.join(', ');
      } else {
        let key = region.emphasized[0];
        let info = region.subregions[key] || {properties: {}};
        name = info.properties.name || key.split('-').join(' ');
      }
    }

    return (
      <div className='tooltip'>
        {titlecase(name.toLowerCase())}
      </div>
    );
  }
}

Tooltip.displayName = 'Tooltip';
Tooltip.propTypes = {
  region: React.PropTypes.object.isRequired
};

module.exports = Tooltip;
