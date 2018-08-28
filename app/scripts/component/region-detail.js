const React = require('react');
const { withRouter } = require('react-router');
const { Link } = require('react-router-dom');
const t = require('prop-types');
const titlecase = require('titlecase');
const numeral = require('numeral');
const Actions = require('../actions');
const Search = require('./search');

class RegionDetail extends React.Component {
  render () {
    let {level, properties, loading} = this.props.region;
    level = level || 'nation';
    properties = properties || {};

    // region name for search box
    let name = loading ? '' : properties.name;
    if (!loading && level === 'district') {
      let state = this.props.region.state;
      name = state.replace(/-/g, ' ') + ' / ' + name;
    }
    name = titlecase(name.toLowerCase());

    // population
    let population = 'Unknown';
    if (!isNaN(properties.tot_pop)) {
      population = numeral(properties.tot_pop).format('0,0');
    }

    // region light output for current month
    let regionMedian;
    if (this.props.regionMedian) {
      regionMedian = numeral(this.props.regionMedian).format('0.00');
    }

    // RGGVY villages
    let {villages, rggvyVillages, rggvyFocus} = this.props;
    let selectButton = rggvyVillages.length === 0 ? '' : (
      <a className='bttn-select-rggvy'
        onClick={Actions.toggleRggvy.bind(Actions)}>
        <div>{rggvyFocus ? 'Show All' : 'Highlight'}</div>
      </a>
    );

    return (
      <section className='spane region-detail'>
        <div className='spane-header'>
        <ul>
          <li className="breadcrumbs">Region</li>
        </ul>
        <div className='spane-header'>
          <h1 className='spane-title'>{name}</h1>
          <a className='bttn-center-map'
            onClick={Actions.recenterMap.bind(Actions)}
            title='Zoom to location bounds'>
            <span>Zoom to location bounds</span>
          </a>
          <Search initialValue={name} />
        </div>
        <div className='spane-body'>
          <dl className='spane-details'>
            <dt>Population (census 2011)</dt>
            <dd>{population}</dd>

            {regionMedian ? [
              <dt key='median-label'>Median Light Output</dt>,
              <dd key='median-value'>{regionMedian}</dd>
            ] : []}

            {this.props.region.district ? [
              <dt>Villages</dt>,
              <dd>{villages.length}</dd>,
              <dt>Villages in national electification program
                (<Link to='story' params={{story: 'rggvy'}}>?</Link>)
                {selectButton}</dt>,
              <dd>{rggvyVillages.length}</dd>
            ] : []}
          </dl>
        </div>
      </section>
    );
  }
};

RegionDetail.propTypes = {
  region: t.object.isRequired,
  villages: t.array,
  rggvyVillages: t.array,
  rggvyFocus: t.bool,
  selectedVillages: t.array,
  regionMedian: t.number
}
module.exports = RegionDetail;
