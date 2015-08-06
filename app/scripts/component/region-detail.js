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
    selectedVillages: React.PropTypes.array,
    regionMedian: React.PropTypes.number
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
    let name = loading ? '' : titlecase(properties.name);
    if (!loading && level === 'district') {
      let state = this.props.region.state;
      name = titlecase(state.replace(/-/g, ' ')) + ' / ' + name;
    }

    // population
    let population = numeral(properties.tot_pop).format('0,0');

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
        <header className='spane-header'>

          <h1 className='spane-title'>{name}</h1>

          <a className='bttn-center-map'
            onClick={Actions.recenterMap.bind(Actions)}
            title='Zoom to location bounds'>
            <span>Zoom to location bounds</span>
          </a>

          <Search initialValue={name} />

        </header>
        <div className='spane-body'>
          <dl className='spane-details'>
            <dt>Level</dt>
            <dd>{titlecase(level)}</dd>
            <dt>Population</dt>
            <dd>{properties ? population : 'Unknown'}</dd>

            {regionMedian ? [
              <dt key='median-label'>Median Light Output (0-63)</dt>,
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
});

module.exports = RegionDetail;
