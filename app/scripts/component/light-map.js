const React = require('react');
const { withRouter } = require('react-router');
const { render } = require('react-dom');
const { connect } = require('react-redux');
const t = require('prop-types');
const mgl = require('mapbox-gl');
const extent = require('turf-extent');
const centroid = require('turf-centroid');
const assign = require('object-assign');
const debounce = require('lodash.debounce');
const ss = require('simple-statistics');
const classnames = require('classnames');

const {showLayer} = require('../lib/mgl-util');
const Actions = require('../actions');

const { emphasize, select } = require('../actions');

const RegionStore = require('../store/region');
const VillageStore = require('../store/village');
const VillageCurveStore = require('../store/village-curve');
const Loading = require('./loading');
const Tooltip = require('./tooltip');
const Modal = require('./modal');
const lightStyles = require('../lib/light-styles');
const { getChildRoute } = require('../lib/route');
const unsupportedText = require('../config').unsupported;
const config = require('../config');

mgl.accessToken = config.mapboxAccessToken;

/**
 * The vis output values corresponding to the 10-value
 * brightness/color scale
 */
const stops = config.villageLightStops;

class LightMap extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      currentRegionHover: false,
      loaded: false
    };
    this.showTooltip = this.showTooltip.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.callOnMap = this.callOnMap.bind(this);
    this.mapQueue = [];
  }

  componentWillUnmount () {
    this._unsubscribe.forEach((unsub) => unsub());
    if (this._removeMap) {
      this._removeMap();
      this.map = this._removeMap = null;
    }
  }

  /**
   * Initialize the map.
   */
  componentDidMount () {
    // check for GL support
    if (!mgl.supported({failIfMajorPerformanceCaveat: true})) {
      this.setState({unsupported: true});
      return;
    }

    const map = window.glMap = this.map = new mgl.Map({
      container: this.refs.node,
      center: [79.667, 20.018],
      zoom: 2.5,
      minZoom: 2.5,
      maxZoom: 12.5,
      dragRotate: false,
      doubleClickZoom: false,
      attributionControl: false,
      style: 'mapbox://styles/devseed/cigvhb50e00039om3c86zjyco'
    });
    // map.addControl(new mgl.Navigation({position: 'top-right'}));
    this._removeMap = this.props.onMapCreated(self.map);

    // suppress 'undefined' message
    map.off('tile.error', map.onError);
    map.once('load', () => {

      // Interaction handlers
      map.on('mousemove', this.onMouseMove);
      map.on('click', this.onClick);

      // Setup a GeoJSON source to use to power the emphasized (hover) feature
      // styling.
      const emphasizedFeatureSource = {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [ ] }
      };
      map.addSource('emphasis-features', emphasizedFeatureSource);

      // Setup a GeoJSON source to use for showing all the villages within a
      // district.
      const districtVillagesSource = {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [ ] },
        buffer: 128
      }
      map.addSource('district-villages', districtVillagesSource);

      // Setup a GeoJSON source to use for showing the currently selected
      // (plotted) villages
      const selectedVillagesSource = {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [ ] },
        buffer: 128
      }
      map.addSource('selected-villages-source', selectedVillagesSource);

      // Monkey-patch some fill layers.
      // Newer versions of GL don't recognize mouseover events on line layers,
      // unless you're actually hovering over the line.
      const boundarySource = {
        type: 'vector',
        url: 'mapbox://devseed.08hn3z6b'
      };

      map.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: Object.assign({}, boundarySource),
        'source-layer': 'states',
        paint: {
          'fill-opacity': 0
        }
      }, 'states');

      map.addLayer({
        id: 'current-state-districts-fill',
        type: 'fill',
        source: Object.assign({}, boundarySource),
        'source-layer': 'districts',
        paint: {
          'fill-opacity': 0
        }
      }, 'current-state-districts');

      // Setup the color scale for the village light visualization: this is
      // actually a series of N separate layers, each with a different color.
      // `setFilters` makes it so that each one only applies to points with
      // the relevant range of `vis_median` values.

      let base = assign({}, map.getLayer('villages-base'));

      // The new mapbox GL spec doesn't return a valid paint object, instead
      // populating it with internal values, so replace it.
      base.paint = {
        'circle-color': '#efc20d',
        'circle-blur': {
          'base': 1,
          'stops': [ [ 5, 0.666 ], [ 8, 1.25 ] ]
        },
        'circle-radius': {
          'base': 1,
          'stops': [ [ 0, 2.5 ], [ 3, 5 ], [ 10, 8 ] ]
        }
      };
      showLayer(map, 'villages-base', false);

      // 1. the 'lightsX' layers, which style the vector tile village points
      // used in national and state view.
      lightStyles.create(base, 'lights', {}, stops.length)
      .forEach(layer => map.addLayer(layer, 'cities'));
      this.setLightFilters();

      // 2. the 'district-lightsX' layers, which will style the geojson source
      // of villages in district view.
      lightStyles.create(base, 'district-lights', {
        source: 'district-villages'
      }, stops.length).forEach((layer) => {
        layer.interactive = true;
        // since this is a geojson layer, remove the source-layer
        delete layer['source-layer'];
        map.addLayer(layer, 'cities');
      });

      // 3. the 'rggvy-lightsX' layers, which will style the same geojson
      // source as 2, but filtered only for rggvy villages.
      lightStyles.create(base, 'rggvy-lights', {
        source: 'district-villages',
        visibility: 'none'
      }, stops.length)
      .forEach((layer) => {
        delete layer['source-layer'];
        map.addLayer(layer, 'cities');
      });

      // Add style for selected villages
      var selectedVillages = cloneVillageLayer(
        base,
        'selected-villages',
        'selected-villages-source',
        '#e64b3b'
      );
      delete selectedVillages['source-layer'];
      map.addLayer(selectedVillages, 'cities');

      // Add style for emphasized features
      map.addLayer({
        'id': 'emphasis',
        'type': 'line',
        'source': 'emphasis-features',
        'paint': {
          'line-color': '#fff',
          'line-width': {
            'base': 1,
            'stops': [ [ 1, 0.5 ], [ 6, 1 ], [ 12, 1.5 ] ]
          }
        }
      }, 'cities');

      var emVillages = cloneVillageLayer(
        base,
        'emphasis-villages',
        'emphasis-features',
        '#fff'
      );
      delete emVillages['source-layer'];
      map.addLayer(emVillages, 'cities');

      if (this.mapQueue.length) {
        this.mapQueue.forEach(fn => fn.call(this));
      }
      this.mapQueue = null;
      this.setState({loaded: true});
    });
  }

  /**
   * Receive new props: specifically, the year and month for rendering
   * the right village light data
   */
  componentWillReceiveProps (newProps) {
    if (this.state.loaded) {
      if (newProps.rggvyFocus !== this.props.rggvyFocus) {
        this.setRggvyFocus(newProps.rggvyFocus);
      }
    }
  }

  componentDidUpdate (prevProps) {
    const { region, villages, match } = this.props;
    if (!region.loading && prevProps.region.key !== region.key) {
      this.callOnMap(() => {
        this.setRegionStyles(region);
        this.flyToRegion(region);
      })
    }

    if (region.emphasized !== prevProps.region.emphasized) {
      this.setEmphasized(region);
    }

    const { year, month } = match.params;
    const prev = prevProps.match.params;
    if (year !== prev.year || month !== prev.month) {
      this.setLightFilters();
    }
  }

  componentWillUnmount () {
    if (this.map) {
      this.map.remove();
    }
  }

  callOnMap (fn) {
    if (this.state.loaded) {
      fn.call(this);
    } else {
      this.mapQueue.push(fn);
    }
  }

  setLightFilters () {
    const { year, month } = this.props.match.params;
    const regionFilter = this.props.region.state ? [['==', 'skey', this.props.region.state]] : [];
    const property = `${year}-${month}`;
    lightStyles.setFilters(this.map, 'lights', stops, property, regionFilter);
  }

  /**
   * Takes either a screen coordinate (e.g. from a mouse event) or a
   * GeoJSON Feature (e.g. a polygon) as the location at which to show
   * the tooltip
   */
  showTooltip (pointOrFeature) {
    // determine location for the popup
    let point;
    if (pointOrFeature.type === 'Feature') {
      let cent = centroid(pointOrFeature);
      point = cent.geometry.coordinates;
    } else if (pointOrFeature.type === 'FeatureCollection' && (pointOrFeature.features || []).length > 0) {
      let cent = centroid(pointOrFeature);
      point = cent.geometry.coordinates;
    } else {
      if (!this.props.region.emphasized || this.props.region.emphasized.length === 0) {
        return;
      }
      point = this.map.unproject(pointOrFeature);
    }

    // remove old popup if it exists
    if (this._tooltip) {
      this._tooltip.remove();
      this._tooltip = null;
    }

    // add tooltip
    let content = document.createElement('div');
    render(<Tooltip region={this.props.region} villages={this.state.villages} />, content);
    this._tooltip = new mgl.Popup({ closeOnClick: false })
    .setLngLat(point)
    .setDOMContent(content.children[0]);
    this._tooltip.addTo(this.map);
  }

  onMouseMove ({point}) {
    const { region } = this.props;
    let subregionPattern = ({
      'nation': /^states-fill/,
      'state': /^current-state-districts-fill/,
      'district': /^(district-lights|rggvy-lights)/
    })[region.level];
    const features = this.map.queryRenderedFeatures(point);
    if (features.length) {
      let subregionFeatures = features.filter((feat) => subregionPattern.test(feat.layer.id));
      this.props.emphasize(subregionFeatures.map((feat) => feat.properties.key));
      // if any of these features have a key that maches the current region,
      // then we know that the mouse is within the current region.
      let currentRegionHover = features
        .map((f) => f.properties.key && f.properties.key === region.key)
        .reduce((a, b) => a || b, false);

      this.setState({currentRegionHover});

      if (subregionFeatures.length > 0) {
        this.showTooltip(point);
      }
    }
  }

  onClick (e) {
    const { region } = this.props;
    const emphasized = region.emphasized || [];

    if (region.level === 'district') {
      if (emphasized.length) {
        Actions.selectVillages(emphasized);
      } else if (!this.state.currentRegionHover) {
        if (region.subregions && region.subregions[region.state]) {
          this.postFlight(() => Actions.selectParent());
          this.updateMap({
            level: 'state',
            key: region.state,
            state: region.state,
            boundary: region.subregions[region.state].geometry
          }, this.props.time);
        } else {
          Actions.selectParent();
        }
      }
    } else if (region.level === 'state' && !this.state.currentRegionHover && emphasized.length === 0) {
      this.postFlight(() => Actions.selectParent());
      this.updateMap({ level: 'nation' }, this.props.time);
    } else if (emphasized.length) {
      this.props.select(emphasized[0]);
      this.props.history.push(getChildRoute(this.props, emphasized[0]));
    }
  }

  /**
   * Receive new props: specifically, the year and month for rendering
   * the right village light data
   */
  componentWillReceiveProps (newProps) {
    if (this.state.loaded) {
      let self = this;
      /*
      this.map.batch(function (batch) {
        self.setTime(batch, self.state.region, newProps.time);
        if (newProps.rggvyFocus !== self.props.rggvyFocus) {
          self.setRggvyFocus(batch, newProps.rggvyFocus);
        }
      });
      */
      if (newProps.compareMode !== this.props.compareMode) {
        this.map.resize();
      }
    }
  }

  /**
   * Receive new village point features from the store
   */
  onVillages (villagesState) {
    let date = `${this.props.time.year}.${this.props.time.month}`;
    villagesState = villagesState[date] ||
      { loading: false, data: { type: 'FeatureCollection', features: [] } };
    if (!villagesState.loading && this.state.loaded) {
      this.state.districtVillagesSource.setData(villagesState.data);
      if (villagesState.data.features.length > 0) {
        let s = stops.map((d, i) => i / (stops.length - 1));
        let quantiles = ss.quantile(villagesState.data.features
          .map((feat) => feat.properties.vis_median), s);
          /*
        this.map.batch(function (batch) {
          lightStyles.setFilters(batch, 'district-lights', quantiles, 'vis_median',
            [[ '==', 'rggvy', false ]]);
          lightStyles.setFilters(batch, 'rggvy-lights', quantiles, 'vis_median',
            [[ '==', 'rggvy', true ]]);
        });
        */
      }
    }
    this.setState({villages: villagesState});
    if (this.state.pendingVillageCurves) {
      this.onVillageCurves(this.state.pendingVillageCurves);
    }
  }

  /**
   * Set whether the RGGVY villages are focused.
   */
  setRggvyFocus (focus) {
    if (this.state.loaded &&
      this.props.region &&
      !this.props.region.loading &&
      this.props.region.district) {
      // set filter based on whether we want to see all villages or just
      // rggvy ones
      lightStyles.forEach('district-lights', stops, layer =>
        showLayer(this.map, layer, focus));
    }
  }

  /**
   * Receive new village curves state from the store.
   */
  onVillageCurves (villageCurves) {
    let loading = villageCurves.loading;
    let villagePoints = this.state.villages.data;
    if (!villagePoints || villagePoints.features.length === 0) {
      this.setState({pendingVillageCurves: villageCurves});
      return;
    }
    if (!loading && villagePoints && this.state.loaded) {
      let selectedVillages = villageCurves.villages;
      let selectedFeatureCollection = {
        type: 'FeatureCollection',
        features: villagePoints.features.filter((feat) =>
          selectedVillages.indexOf(feat.properties.key) >= 0)
      };
      this.map.getSource('selected-villages-source').setData(selectedFeatureCollection);
      this.setState({pendingVillageCurves: false});
    }
  }

  /**
   * Reset the map view to the current region.
   */
  resetView () {
    if (this.state.loaded && !this.props.region.loading) {
      this.flyToRegion(this.props.region);
    }
  }

  /**
   * Update the map according to the current region and month
   */
  updateMap (region, time) {
    var self = this;
    /*
    this.map.batch(function (batch) {
      self.setEmphasized(batch, region);
      self.setTime(batch, region, time);
      if (!region.loading && region.key !== self.state.currentRegionKey) {
        self.setRegionStyles(batch, region);
      }
    });

    if (!region.loading && region.key !== self.state.currentRegionKey) {
      self.flyToRegion(region);
      self.setState({ currentRegionKey: region.key });
    }
    */
  }

  /**
   * Update the emphasized region source
   */
  setEmphasized (region) {
    const { district, emphasized, subregions } = region;
    const key = Array.isArray(emphasized) && emphasized.length ? emphasized[0] : null;
    const type = 'FeatureCollection';
    const source = this.map.getSource('emphasis-features');
    if (!key) {
      this.callOnMap(() => {
        source.setData({type, features: []});
      });
    } else {
      if (district && this.state.villages.data) {
        const { features } = this.state.villages.data;
        this.callOnMap(() => {
          source.setData({type, features: features.filter(f => emphasized.indexOf(f.properties.key) >= 0)});
          showLayer(this.map, 'emphasis-villages', true);
          showLayer(this.map, 'emphasis', false);
        });
      } else if (subregions[key]) {
        source.setData({type: 'Feature', geometry: subregions[key].geometry});
        showLayer(this.map, 'emphasis-villages', false);
        showLayer(this.map, 'emphasis', true);
      }
    }
  }

  /**
   * Set the appropriate map styles for the given region.  This is a lower-
   * level method that does NOT check whether we're already at the given
   * region
   */
  setRegionStyles (region) {
    const visibility = {
      'current-state-districts': ['district', 'state'],
      'states': ['nation', 'state']
    };
    for (let layer in visibility) {
      let visible = visibility[layer].indexOf(region.level) >= 0;
      showLayer(this.map, layer, visible);
    }
    if (region.state) {
      // Distinguish districts of the current state, or just the current
      // district if we're in district view.
      let filters = [['==', 'state_key', region.state]];
      if (region.level === 'district') {
        filters.push(['==', 'key', region.district]);
      }
      this.map.setFilter('districts', ['none'].concat(filters));
      this.map.setFilter('current-state-districts', ['all'].concat(filters));
    }

    lightStyles.forEach('lights', stops, (layer) => {
      showLayer(this.map, layer, !region.district);
    });
  }

  /**
   * Fly to the given region.  This is a lower-level method that does NOT
   * check whether we're already at the given region.
   */
  flyToRegion (region) {
    // Fly to the current region.
    if (region.boundary) {
      this.flyToFeature({ type: 'Feature', geometry: region.boundary });
    } else {
      this.flyToNation();
    }
  }

  flyToFeature (feature) {
    let [minx, miny, maxx, maxy] = extent(feature);
    this.map.fitBounds([[minx, miny], [maxx, maxy]], {
      speed: 1.2,
      curve: 1.42
    });
  }

  flyToNation () {
    this.map.flyTo({
      center: [79.667, 20.018],
      zoom: 3.5,
      speed: 1.2,
      curve: 1.42
    });
  }

  postFlight (cb) {
    this.map.once('moveend', () => cb());
  }

  render () {
    let cn = classnames('light-map', {
      ['light-map_' + this.props.compareMode]: this.props.compareMode
    });

    if (this.state.unsupported) {
      return (
        <div className={cn}>
          <Modal isOn isPermanent content={unsupportedText} />
        </div>
      );
    }

    let loading = !this.state.loaded ||
      this.props.region.loading;
    let errors = (!this.props.region || !this.state.villages) ? []
      : [this.props.region, this.state.villages].map(s => s.error);

    return (
      <div className={cn}>
        { loading ? <Loading errors={errors} /> : '' }
        <div className='map-inner' ref='node' />
      </div>
    );
  }

  /*
  mapMaybeLoaded () {
    if (this.mapLoaded()) { return; }
    this.setState({
      villages: {loading: true}
    });
    // this.onRegion(RegionStore.getInitialState());
    // this.onVillages(VillageStore.getInitialState());
    // this.onVillageCurves(VillageCurveStore.getInitialState());

    this._unsubscribe = [];
    /*
    this._unsubscribe.push(VillageStore.listen(this.onVillages.bind(this)));
    this._unsubscribe.push(VillageCurveStore
    .listen(this.onVillageCurves.bind(this)));
    this._unsubscribe.push(RegionStore.listen(this.onRegion.bind(this)));
    this._unsubscribe.push(Actions.recenterMap
      .listen(this.resetView.bind(this)));
  }
  */
}

LightMap.propTypes = {
  time: t.object.isRequired,
  match: t.object,

  emphasize: t.func,
  select: t.func,

  region: t.object,
  villages: t.object,

  rggvyFocus: t.bool,
  onMapCreated: t.func.isRequired,
  compareMode: t.oneOf(['left', 'right', false])
};

const selector = (state) => ({
  region: state.region.boundaries,
  villages: state.village.districts
});

const dispatch = { emphasize, select };
module.exports = withRouter(connect(selector, dispatch)(LightMap));

function cloneVillageLayer (base, id, source, color) {
  let layer = lightStyles.clone(base);
  assign(layer, { id, source });
  layer.paint = assign({}, layer.paint, {
    'circle-color': color,
    'circle-opacity': 1,
    'circle-blur': 0
  });
  layer.paint['circle-radius'] = assign({}, layer.paint['circle-radius']);
  layer.paint['circle-radius'].stops = layer.paint['circle-radius'].stops
    .map((stop) => [stop[0], stop[1] * 0.667]);
  return layer;
}
