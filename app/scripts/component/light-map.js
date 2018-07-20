const React = require('react');
const { render } = require('react-dom');
const t = require('prop-types');
const mgl = require('mapbox-gl');
const extent = require('turf-extent');
const centroid = require('turf-centroid');
const assign = require('object-assign');
const debounce = require('lodash.debounce');
const ss = require('simple-statistics');

const {showLayer} = require('../lib/mgl-util');
const Actions = require('../actions');
const RegionStore = require('../store/region');
const VillageStore = require('../store/village');
const VillageCurveStore = require('../store/village-curve');
const Loading = require('./loading');
const Tooltip = require('./tooltip');
const Modal = require('./modal');
const lightStyles = require('../lib/light-styles');
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
      stateBoundaries: {},
      currentRegionKey: 'never been set'
    };
    this.showTooltip = this.showTooltip.bind(this);
  }

  componentWillUnmount () {
    if (Array.isArray(this._unsubscribe)) {
      this._unsubscribe.forEach((unsub) => unsub());
    }
    if (this.map) {
      this.map.remove();
    }
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
      if (!this.state.region.emphasized || this.state.region.emphasized.length === 0) {
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
    render(<Tooltip region={this.state.region} villages={this.state.villages} />, content);
    this._tooltip = new mgl.Popup({ closeOnClick: false })
    .setLngLat(point)
    .setDOMContent(content.children[0]);
    this._tooltip.addTo(this.map);

    /*
    el.addEventListener('click', () => {
      if (!this.state.region.district && this.state.region.emphasized &&
        this.state.region.emphasized.length > 0) {
        Actions.select(this.state.region.emphasized[0]);
      }
    });
    */
  }


  isMapLoaded () {
    return !!this._mapLoaded;
  }

  /*
   * We're waiting for a few asynchronous things to land before we can
   * treat the map as being actually loaded.  Once it *is* loaded, we
   * need to handle our initial state (i.e. styles based on what region
   * we're in, village dots, selected villages...).  So this method gets
   * called at the end of each of the asychronous things we're waiting for;
   * each time, check if they're all done, and if so, handle that initial
   * state.
   */
  mapMaybeLoaded () {
    if (this.isMapLoaded()) { return; }
    this._mapLoaded = true;
    this.setState({
      region: {loading: true},
      villages: {loading: true}
    });
    this.onRegion(RegionStore.getInitialState());
    this.onVillages(VillageStore.getInitialState());
    this.onVillageCurves(VillageCurveStore.getInitialState());

    this._unsubscribe = [];
    this._unsubscribe.push(VillageStore.listen(this.onVillages.bind(this)));
    this._unsubscribe.push(VillageCurveStore
      .listen(this.onVillageCurves.bind(this)));
    this._unsubscribe.push(RegionStore.listen(this.onRegion.bind(this)));
    this._unsubscribe.push(Actions.recenterMap
      .listen(this.resetView.bind(this)));
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

    // suppress 'undefined' message
    map.off('tile.error', map.onError);
    map.once('load', () => {

      // Interaction handlers
      map.on('mousemove', this.onMouseMove.bind(this));
      map.on('click', this.onClick.bind(this));

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
      this.mapMaybeLoaded();
    });
  }

  /**
   * Receive new props: specifically, the year and month for rendering
   * the right village light data
   */
  componentWillReceiveProps (newProps) {
    if (this.isMapLoaded()) {
      this.setTime(self.state.region, newProps.time);
      if (newProps.rggvyFocus !== self.props.rggvyFocus) {
        this.setRggvyFocus(newProps.rggvyFocus);
      }
    }
  }

  onMouseMove ({point}) {
    let region = this.state.region;
    let subregionPattern = ({
      'nation': /^states/,
      'state': /^current-state-districts/,
      'district': /^(district-lights|rggvy-lights)/
    })[region.level] || /x^/;

    const features = this.map.queryRenderedFeatures([
      [point.x - 5, point.y - 5],
      [point.x + 5, point.y + 5]
    ]);
    if (features.length) {
      let subregionFeatures = features.filter((feat) => subregionPattern.test(feat.layer.id));
      // save the `hoverFeature` so that we can optimistically start zooming
      // to it if the user clicks.
      Actions.emphasize(subregionFeatures.map((feat) => feat.properties.key));

      // if any of these features have a key that maches the current region,
      // then we know that the mouse is within the current region.
      let currentRegionHover = features
        .map(f => f.properties.key && f.properties.key === region.key)
        .reduce((a, b) => a || b, false);

      this.setState({
        hoverFeature: subregionFeatures[0],
        currentRegionHover
      });

      if (subregionFeatures.length > 0) {
        this.showTooltip(point);
      }
    }
  }

  onClick (e) {
    if (!this.isMapLoaded() || this.isInFlight()) { return; }

    let self = this;
    let region = self.state.region;
    let emphasized = region.emphasized || [];

    if (region.level === 'district') {
      if (emphasized.length) {
        Actions.selectVillages(emphasized);
      } else if (!self.state.currentRegionHover) {
        if (self.state.stateBoundaries[region.state]) {
          self.postFlight(() => Actions.selectParent());
          self.updateMap({
            level: 'state',
            key: region.state,
            state: region.state,
            boundary: self.state.stateBoundaries[region.state].geometry
          }, self.props.time);
        } else {
          Actions.selectParent();
        }
      }
    } else if (region.level === 'state' && !self.state.currentRegionHover && emphasized.length === 0) {
      self.postFlight(() => Actions.selectParent());
      self.updateMap({ level: 'nation' }, self.props.time);
    } else if (emphasized.length) {
      // we're hovering over a state or district -- zoom in to it.
      if (self.state.hoverFeature) {
        self.postFlight(Actions.select.bind(Actions, emphasized[0]));
        let key = self.state.hoverFeature.properties.key;
        self.updateMap({
          level: region.level === 'nation' ? 'state' : 'district',
          state: region.state || key,
          district: region.state ? key : undefined,
          key: key,
          boundary: self.state.hoverFeature.geometry
        }, self.props.time);
      } else {
        Actions.select(emphasized[0]);
      }
    }
  }

  /**
   * Receive new region state from the store
   */
  onRegion (regionState) {
    let stateBoundaries = this.state.stateBoundaries;
    if (regionState.level === 'nation' && !regionState.loading && regionState.subregions && Object.keys(stateBoundaries).length === 0
    ) {
      stateBoundaries = assign({}, regionState.subregions);
    }

    if (!regionState.loading && this.isMapLoaded()) {
      this.updateMap(regionState, this.props.time);
      this.setState({region: regionState, stateBoundaries});
    } else {
      // if we're not updating the map, DON'T save the region to
      // the state, because our lazy update logic relies on the saved
      // state to know what actually needs updating.
      this.setState({stateBoundaries});
    }
  }

  /**
   * Receive new village point features from the store
   */
  onVillages (villagesState) {
    if (!villagesState.loading && this.isMapLoaded()) {
      this.map.getSource('district-villages').setData(villagesState.data);
      if (villagesState.data.features.length > 0) {
        let s = stops.map((d, i) => i / (stops.length - 1));
        let quantiles = ss.quantile(villagesState.data.features
          .map(feat => feat.properties.vis_median), s);
        lightStyles.setFilters(this.map, 'district-lights', quantiles, 'vis_median',
          [[ '==', 'rggvy', false ]]);
        lightStyles.setFilters(this.map, 'rggvy-lights', quantiles, 'vis_median',
          [[ '==', 'rggvy', true ]]);
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
    if (this.isMapLoaded() &&
      this.state.region &&
      !this.state.region.loading &&
      this.state.region.district) {
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
    if (!loading && villagePoints && this.isMapLoaded()) {
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
    if (this.isMapLoaded() && !this.state.region.loading) {
      this.flyToRegion(this.state.region);
    }
  }

  /**
   * Update the map according to the current region and month
   */
  updateMap (region, time) {
    this.setEmphasized(region);
    this.setTime(region, time);
    if (!region.loading && region.key !== this.state.currentRegionKey) {
      this.setRegionStyles(region);
    }

    if (!region.loading && region.key !== this.state.currentRegionKey) {
      this.flyToRegion(region);
      this.setState({ currentRegionKey: region.key });
    }
  }

  /**
   * Style the light points according to the current month. Only
   * applies to `nation` and `state` levels -- `district`-level styling
   * happens in onVillages
   */
  setTime (region, time) {
    const {year, month} = time;
    const doUpdateTime = this.isMapLoaded() && !region.district &&
      (!this.state.time ||
      year !== this.state.time.year ||
      month !== this.state.time.month ||
      region.level !== this.state.region.level);

    if (!doUpdateTime) { return; }

    const property = year + '-' + month;
    const regionFilter = region.state ? [[ '==', 'skey', region.state ]] : [];
    lightStyles.setFilters(this.map, 'lights', stops, property, regionFilter);
    this.setState({time});
  }

  /**
   * Update the emphasized region source
   */
  setEmphasized (region) {
    if (region.loading) { return; }
    // If there's an emphasized region, and it's different than the
    // existing one, then style it.
    const currentEmphasized = (region.emphasized || [])[0];
    if (currentEmphasized) {
      const map = this.map;
      let fc;
      if (region.district && this.state.villages.data) {
        let features = this.state.villages.data.features
          .filter((feat) => region.emphasized.indexOf(feat.properties.key) >= 0);
        fc = { type: 'FeatureCollection', features };
        this.map.getSource('emphasis-features').setData(fc);
        showLayer(map, 'emphasis-villages', true);
        showLayer(map, 'emphasis', false);
      } else if (region.subregions[currentEmphasized]) {
        fc = {
          type: 'Feature',
          properties: {},
          geometry: region.subregions[currentEmphasized].geometry
        };
        this.map.getSource('emphasis-features').setData(fc);
        showLayer(map, 'emphasis-villages', false);
        showLayer(map, 'emphasis', true);
        this.showTooltip(fc);
      }
    } else {
      this.map.getSource('emphasis-features').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }

  /**
   * Set the appropriate map styles for the given region.  This is a lower-
   * level method that does NOT check whether we're already at the given
   * region
   */
  setRegionStyles (region) {
    if (region.loading) { return; }

    const visibility = {
      'current-state-districts': ['district', 'state'],
      'states': ['nation', 'state']
    };

    for (let layer in visibility) {
      let visible = visibility[layer].indexOf(region.level) >= 0;
      showLayer(this.map, layer, visible);
    }

    // Distinguish districts of the current state, or just the current
    // district if we're in district view.
    let filters = [[ '==', 'state_key', region.state ]];
    if (region.level === 'district') {
      filters.push([ '==', 'key', region.district ]);
    }
    this.map.setFilter('districts', ['none'].concat(filters));
    this.map.setFilter('current-state-districts', ['all'].concat(filters));

    lightStyles.forEach('lights', stops, (layer) => {
      showLayer(this.map, layer, !region.district);
    });
  }

  /**
   * Fly to the given region.  This is a lower-level method that does NOT
   * check whether we're already at the given region.
   */
  flyToRegion (region) {
    if (typeof this._flights === 'undefined') { this._flights = 0; }
    this._flights += 1;
    this.map.once('moveend', () => { this._flights -= 1; });
    if (this._flights > 1) { console.warn('Multiple flyTo calls.'); }

    if (region.loading) { return; }
    // Fly to the current region.
    if (region.boundary) {
      this.flyToFeature({ type: 'Feature', geometry: region.boundary });
    } else {
      this.flyToNation();
    }
  }

  /**
   * Answers if the map is currently in flight from one view to another.
   */
  isInFlight () {
    return (this._flights > 0);
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
    if (this.state.unsupported) {
      return (
        <div className='light-map'>
          <Modal isOn={true} isPermanent={true} content={unsupportedText} />
        </div>
      );
    }

    let loading = !this.isMapLoaded() ||
      !this.state.region || !this.state.villages ||
      this.state.region.loading ||
      this.state.villages.loading;
    let errors = (!this.state.region || !this.state.villages) ? []
      : [this.state.region, this.state.villages].map(s => s.error);

    return (
      <div className='light-map'>
        { loading ? <Loading errors={errors} /> : '' }
        <div className='map-inner' ref='node' />
      </div>
    );
  }
}

LightMap.propTypes = {
  time: t.object.isRequired,
  rggvyFocus: t.bool
};

module.exports = LightMap;

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
    .map(stop => [stop[0], stop[1] * 0.667]);
  return layer;
}
