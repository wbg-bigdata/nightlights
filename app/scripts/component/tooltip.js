const React = require('react');
const t = require('prop-types');
const titlecase = require('titlecase');

class Tooltip extends React.Component {
  constructor(props) {
    super(props);
    this.select = this.select.bind(this);
  }

  pass (e) {
    e.preventDefault();
  }

  select (e) {
    /*
    el.addEventListener('click', () => {
      if (!this.state.region.district && this.state.region.emphasized &&
        this.state.region.emphasized.length > 0) {
        Actions.select(this.state.region.emphasized[0]);
      }
    });
    */
  }

  render () {
    const {region, villages} = this.props;
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
      <div className='tooltip'
        onWheel={this.pass}
        onClick={this.select}
      >{name}</div>
    ) : null;
  }
}

Tooltip.propTypes = {
  region: t.object.isRequired,
  villages: t.object
};

module.exports = Tooltip;
