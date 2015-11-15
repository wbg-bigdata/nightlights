let React = require('react');
let titlecase = require('titlecase');

class Tooltip extends React.Component {
  render () {
    let {region, villages} = this.props;

    let name = '';
    if (!region.loading && region.emphasized && region.emphasized.length > 0) {
      if (region.level === 'district' && villages && villages.data) {
        let villagecodes = region.emphasized;
        name = villages.data.features
          .filter(f => f.properties.name && villagecodes.indexOf(f.properties.key) >= 0)
          .map(f => f.properties.name)
          .map(n => titlecase(n.toLowerCase()))
          .map(n => <div>{n}</div>);
      } else {
        let key = region.emphasized[0];
        let info = region.subregions[key] || {properties: {}};
        name = info.properties.name || key.split('-').join(' ');
        name = titlecase(name.toLowerCase()).trim();
      }
    }

    return name.length ? (
      <div className='tooltip'>{name}</div>
    ) : null;
  }
}

Tooltip.displayName = 'Tooltip';
Tooltip.propTypes = {
  region: React.PropTypes.object.isRequired,
  villages: React.PropTypes.object
};

module.exports = Tooltip;
