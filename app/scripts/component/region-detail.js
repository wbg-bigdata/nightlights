let React = require('react');
let Router = require('react-router');
let titlecase = require('titlecase');
let numeral = require('numeral');
let Actions = require('../actions');
let Link = Router.Link;
let Search = require('./search');

let RegionDetail = React.createClass({
  displayName: 'RegionDetail',

  propTypes: {
    region: React.PropTypes.object.isRequired,
    villages: React.PropTypes.array,
    rggvyVillages: React.PropTypes.array,
    rggvyFocus: React.PropTypes.bool,
    selectedVillages: React.PropTypes.array
  },

  mixins: [Router.State],

  render () {
    let {
      level,
      properties,
      loading
    } = this.props.region;

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

    // RGGVY villages
    let {villages, rggvyVillages, rggvyFocus} = this.props;
    let selectButton = rggvyVillages.length === 0 ? '' : (
      <a className='bttn-select-rggvy'
        onClick={Actions.toggleRggvy}>
        <div>{rggvyFocus ? 'Show All' : 'Highlight'}</div>
      </a>
    );

    return (
      <section className='spane region-detail'>
        <ul>
          <li className='breadcrumbs'>Region</li>
        </ul>
        <div className='spane-header'>
          <h1 className='spane-title'>{name}</h1>

          <a className='bttn-center-map'
            onClick={Actions.recenterMap}
            title='Zoom to location bounds'>
            <span>Zoom to location bounds</span>
          </a>

          <Search initialValue={name} />

        </div>
        <div className='spane-body'>
          <dl className='spane-details'>
            <dt>Population (census 2011)</dt>
            <dd>{population}</dd>

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
});

module.exports = RegionDetail;
