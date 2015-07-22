let React = require('react');
let mgl = require('mapbox-gl');
let extent = require('turf-extent');
let centroid = require('turf-centroid');
let assign = require('object-assign');
let throttle = require('lodash.throttle');
let debounce = require('lodash.debounce');
let {setFilterLazy, reloadSources} = require('../lib/mgl-util');
let Actions = require('../actions');
let RegionStore = require('../store/region');
let VillageStore = require('../store/village');
let VillageCurveStore = require('../store/village-curve');
let Loading = require('./loading');
let Tooltip = require('./tooltip');
let Modal = require('./modal');
let mainStyle = require('./map-styles/main.json');
let emphasisStyles = require('./map-styles/emphasis.json');
let selectedVillagesStyle = require('./map-styles/selected-villages.json');
let lightStyles = require('./map-styles/light-styles');
let unsupportedText = require('../config').unsupported;

mgl.accessToken = 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q';

/**
 * The vis output values corresponding to the 10-value
 * brightness/color scale
 */
const stops = [1, 2, 4, 6, 7, 8, 9, 10, 20, 30];

class LightMap extends React.Component {
  constructor () {
    super();
    this.state = {
      emphasizedFeatureSource: null,
      districtVillagesSource: null,
      selectedVillagesSource: null,
      sourcesLoaded: {},
      stylesLoaded: false,
      stateBoundaries: {}
    };

    let self = this;
    /**
     * Takes either a screen coordinate (e.g. from a mouse event) or a
     * GeoJSON Feature (e.g. a polygon) as the location at which to show
     * the tooltip
     */
    this.showTooltip = debounce(function (pointOrFeature) {
      // determine location for the popup
      let point;
      if (pointOrFeature.type === 'Feature') {
        let cent = centroid(pointOrFeature);
        point = cent.geometry.coordinates.reverse();
      } else if (pointOrFeature.type === 'FeatureCollection'
      && (pointOrFeature.features || []).length > 0) {
        let cent = centroid(pointOrFeature);
        point = cent.geometry.coordinates.reverse();
      } else {
        if (!self.state.region.emphasized
        || self.state.region.emphasized.length === 0) {
          return;
        }
        point = self.map.unproject(pointOrFeature);
      }

      // remove old popup if it exists
      if (self._tooltip) {
        self._tooltip.remove();
        self._tooltip = null;
      }

      // add tooltip
      self._tooltip = new mgl.Popup({ closeOnClick: false })
      .setLatLng(point)
      .setHTML(React.renderToStaticMarkup(
        <Tooltip region={self.state.region} />
      ));
      self._tooltip.addTo(self.map);

      // swallow scroll and mousewheel events to prevent the whole page
      // (rather than the map) from getting weirdly zoomed
      let el = document.querySelector('.tooltip');
      el.addEventListener('wheel', pass, false);
      el.addEventListener('mousewheel', pass, false);
      function pass (e) { e.preventDefault(); }
    }, 300);
  }

  componentWillUnmount () {
    this._unsubscribe.forEach((unsub) => unsub());
    if (this.map) {
      this.map.remove();
    }
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
    let loaded = this.state.sourcesLoaded['india-boundaries'] &&
      this.state.sourcesLoaded['village-lights'] &&
      this.state.stylesLoaded;

    if (loaded && !this.isMapLoaded()) {
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

    var self = this;

    window.glMap = self.map = new mgl.Map({
      container: React.findDOMNode(this).querySelector('.map-inner'),
      center: [20.018, 79.667],
      zoom: 2.5,
      minZoom: 2.5,
      maxZoom: 12.5,
      dragRotate: false,
      doubleClickZoom: false,
      style: mainStyle
    });
    console.log('The Mapbox GL map is available as `window.glMap`');
    self.map.addClass('nation');

    // Interaction handlers
    self.map.on('mousemove', throttle(this.onMouseMove.bind(this), 100));
    self.map.on('click', debounce(this.onClick.bind(this), 200));

    // Track which map sources have been loaded.
    self.map.on('source.load', function onSourceLoad ({source}) {
      self.setState({
        sourcesLoaded: assign(self.state.sourcesLoaded, { [source.id]: true })
      });
      self.mapMaybeLoaded();
    });

    self.map.once('style.load', () => {
      // Setup a GeoJSON source to use to power the emphasized (hover) feature
      // styling.
      let emphasizedFeatureSource = new mgl.GeoJSONSource({
        data: { type: 'FeatureCollection', features: [ ] }
      });
      self.map.addSource('emphasis-features', emphasizedFeatureSource);

      // Setup a GeoJSON source to use for showing all the villages within a
      // district.
      let districtVillagesSource = new mgl.GeoJSONSource({
        data: { type: 'FeatureCollection', features: [ ] },
        buffer: 128
      });
      self.map.addSource('district-villages', districtVillagesSource);

      // Setup a GeoJSON source to use for showing the currently selected
      // (plotted) villages
      let selectedVillagesSource = new mgl.GeoJSONSource({
        data: { type: 'FeatureCollection', features: [ ] },
        buffer: 128
      });
      self.map.addSource('selected-villages-source', selectedVillagesSource);

      // Setup the color scale for the village light visualization: this is
      // actually a series of N separate layers, each with a different color.
      // `setFilters` makes it so that each one only applies to points with
      // the relevant range of `vis_median` values.

      // 1. the 'lightsX' layers, which style the vector tile village points
      // used in national and state view.
      lightStyles.create('lights', 'village-lights', '10percgeojson', stops.length)
        .forEach(self.map.addLayer, self.map, 'cities');

      // 2. the 'district-lightsX' layers, which will style the geojson source
      // of villages in district view.
      lightStyles
        .create('district-lights', 'district-villages', undefined, stops.length)
        .forEach((layer) => {
          layer.interactive = true;
          self.map.addLayer(layer, 'cities');
        });

      // 3. the 'rggvy-lightsX' layers, which will style the same geojson
      // source as 2, but filtered only for rggvy villages.
      lightStyles
        .create('rggvy-lights', 'district-villages', undefined, stops.length)
        .forEach((layer) => {
          layer.interactive = true;
          self.map.addLayer(layer, 'cities');
        });

      // Add style for selected villages
      self.map.addLayer(selectedVillagesStyle, 'cities');

      // Add style for emphasized features
      emphasisStyles.forEach(style => self.map.addLayer(style, 'cities'));

      self.setState({
        stylesLoaded: true,
        emphasizedFeatureSource,
        districtVillagesSource,
        selectedVillagesSource
      });
      self.mapMaybeLoaded();
    });
  }

  onMouseMove (e) {
    if (!this.isMapLoaded() || this.isInFlight()) { return; }
    if (this._tooltip) {
      this._tooltip.remove();
      this._tooltip = null;
      this.showTooltip.cancel();
    }

    let region = this.state.region;
    let subregionPattern = ({
      'nation': /^states/,
      'state': /^current-state-districts/,
      'district': /^(district-lights|rggvy-lights)/
    })[region.level] || /x^/;

    this.map.featuresAt(e.point, { radius: 10 }, (err, features) => {
      if (err) { return console.error(err); }
      if (this.isInFlight()) { return; } // double check to avoid race
      let subregionFeatures = features
        .filter((feat) => subregionPattern.test(feat.layer.id));
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
        this.showTooltip(e.point);
      }
    });
  }

  onClick (e) {
    if (!this.isMapLoaded() || this.isInFlight()) { return; }

    let self = this;
    let region = self.state.region;
    let emphasized = region.emphasized || [];

    // At region level the emphasized array only tells us what villages
    // we are hovering. We use map.featuresAt to know if a click is:
    // 1. over the chosen district => do nothing
    // 2. out of the district => zoom to parent
    if (region.level === 'district') {
      if (emphasized.length) {
        Actions.selectVillages(emphasized);
      } else if (!self.state.currentRegionHover) {
        if (self.state.stateBoundaries[region.state]) {
          self.postFlight(() => Actions.selectParent());
          self.updateMap({
            level: 'state',
            state: region.state,
            boundary: self.state.stateBoundaries[region.state].geometry
          }, self.props.time);
        } else {
          Actions.selectParent();
        }
      }
    } else if (region.level === 'state' && emphasized.length === 0) {
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
          boundary: self.state.hoverFeature.geometry
        }, self.props.time);
      } else {
        Actions.select(emphasized[0]);
      }
    }
  }

  /**
   * Receive new props: specifically, the year and month for rendering
   * the right village light data
   */
  componentWillReceiveProps (newProps) {
    if (this.isMapLoaded()) {
      this.setTime(this.state.region, newProps.time);
      if (newProps.rggvyFocus !== this.props.rggvyFocus) {
        this.setRggvyFocus(newProps.rggvyFocus);
      }
    }
  }

  /**
   * Receive new region state from the store
   */
  onRegion (regionState) {
    let stateBoundaries = this.state.stateBoundaries;
    if (regionState.level === 'nation'
    && !regionState.loading
    && regionState.subregions
    && Object.keys(stateBoundaries).length === 0
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
      this.state.districtVillagesSource.setData(villagesState.data);
      lightStyles.setFilters(this.map, 'district-lights', stops, 'vis_median',
        [[ '==', 'rggvy', false ]]);
      lightStyles.setFilters(this.map, 'rggvy-lights', stops, 'vis_median',
        [[ '==', 'rggvy', true ]]);
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
        this.showLayer(layer, focus));
      if (focus) {
        this.map.addClass('rggvy');
      } else {
        this.map.removeClass('rggvy');
      }
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
      this.state.selectedVillagesSource.setData(selectedFeatureCollection);
      this.setState({pendingVillageCurves: false});
    }
  }

  /**
   * Test whether the given layer is the interactive subregion layer
   * corresponding to the current region
   */
  isSubregionLayer (layer) {
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
    if (!region.loading && region.level !== this.state.currentLevel) {
      this.setRegionStyles(region);
      this.flyToRegion(region);
      this.setState({ currentLevel: region.level });
    }
  }

  /**
   * Style the light points according to the current month. Only
   * applies to `nation` and `state` levels -- `district`-level styling
   * happens in onVillages
   */
  setTime (region, time) {
    let {year, month} = time;
    let doUpdateTime = this.isMapLoaded() && !region.district &&
      (!this.state.time ||
      year !== this.state.time.year ||
      month !== this.state.time.month ||
      region.level !== this.state.region.level);

    if (!doUpdateTime) { return; }

    let property = year + '-' + month;
    let regionFilter = region.state ? [[ '==', 'skey', region.state ]] : [];
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
    let currentEmphasized = (region.emphasized || [])[0];
    if (currentEmphasized) {
      let fc;
      if (region.district && this.state.villages.data) {
        let features = this.state.villages.data.features
          .filter((feat) => region.emphasized.indexOf(feat.properties.key) >= 0);
        fc = { type: 'FeatureCollection', features };
        this.state.emphasizedFeatureSource.setData(fc);
        this.showLayer('emphasis-villages', true);
        this.showLayer('emphasis', false);
      } else if (region.subregions[currentEmphasized]) {
        fc = {
          type: 'Feature',
          properties: {},
          geometry: region.subregions[currentEmphasized].geometry
        };
        this.state.emphasizedFeatureSource.setData(fc);
        this.showLayer('emphasis-villages', false);
        this.showLayer('emphasis', true);
        this.showTooltip(fc);
      }
    } else {
      this.state.emphasizedFeatureSource.setData({
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
    let self = this;

    // Set the paint class for the current level
    this.map.setClasses([region.level]);

    // Distinguish districts of the current state, or just the current
    // district if we're in district view.
    let filters = [[ '==', 'state_key', region.state ]];
    if (region.level === 'district') {
      filters.push([ '==', 'key', region.district ]);
    }
    let sources = [];
    sources.push(setFilterLazy(this.map, 'districts', ['none'].concat(filters)));
    sources.push(setFilterLazy(this.map, 'current-state-districts',
      ['all'].concat(filters)));

    lightStyles.forEach('lights', stops, function (layer) {
      self.showLayer(layer, !region.district);
    });

    reloadSources(this.map, sources);
  }

  /**
   * Set the visibility of the given layer.
   */
  showLayer (layer, show) {
    let currentVisibility = this.map.getLayoutProperty(layer, 'visibility');
    if (show && currentVisibility !== 'visible') {
      this.map.setLayoutProperty(layer, 'visibility', 'visible');
    } else if (!show && currentVisibility === 'visible') {
      this.map.setLayoutProperty(layer, 'visibility', 'none');
    }
  }

  /**
   * Fly to the given region.  This is a lower-level method that does NOT
   * check whether we're already at the given region.
   */
  flyToRegion (region) {
    if (typeof this._flights === 'undefined') {
      this._flights = 0;
      this.map.on('moveend', () => {
        this._flights -= 1;
      });
    }
    this._flights += 1;
    if (this._flights > 1) {
      console.warn('Multiple flyTo calls.');
    }

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
    this.map.fitBounds([[miny, minx], [maxy, maxx]], {
      speed: 1.2,
      curve: 1.42
    });
  }

  flyToNation () {
    this.map.flyTo({
      center: [20.018, 79.667],
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
    let errors = (!this.state.region || !this.state.villages) ? [] :
      [this.state.region, this.state.villages].map(s => s.error);

    return (
      <div className='light-map'>
        { loading ? <Loading errors={errors} /> : '' }
        <div className='map-inner' />
      </div>
    );
  }
}

LightMap.displayName = 'LightMap';
LightMap.propTypes = {
  time: React.PropTypes.object.isRequired,
  rggvyFocus: React.PropTypes.bool
};

module.exports = LightMap;
