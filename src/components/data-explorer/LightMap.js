import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { render } from "react-dom";
import classnames from "classnames";
import t from "prop-types";
import bbox from "@turf/bbox";
import mgl from "mapbox-gl";
import extent from "turf-extent";
import centroid from "turf-centroid";

// Config
import config from "../../config";

// Actions
import { emphasize } from "../../actions/regions";

// Components
import Tooltip from "./Tooltip";
import Modal from "../modal";
import Loading from "./Loading";

// Helper functions
const { showLayer } = require("../../lib/mgl-util");
const lightStyles = require("../../lib/light-styles");
function cloneVillageLayer(base, id, source, color) {
  let layer = lightStyles.clone(base);
  Object.assign(layer, { id, source });
  layer.paint = Object.assign({}, layer.paint, {
    "circle-color": color,
    "circle-opacity": 1,
    "circle-blur": 0
  });
  layer.paint["circle-radius"] = Object.assign(
    {},
    layer.paint["circle-radius"]
  );
  layer.paint["circle-radius"].stops = layer.paint["circle-radius"].stops.map(
    stop => [stop[0], stop[1] * 0.667]
  );
  return layer;
}

// Get stops
const stops = config.villageLightStops;

// Styles: MapboxGL CSS is conflicting with current app styles, leaving comented for now
// import 'mapbox-gl/dist/mapbox-gl.css';
mgl.accessToken = config.mapboxAccessToken;

class LightMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previousActiveRegionKey: "not set",
      loaded: false
    };

    this.mapQueue = [];

    // Bindings
    this.callOnMap = this.callOnMap.bind(this);
    this.flyToNation = this.flyToNation.bind(this);
    this.flyToRegion = this.flyToRegion.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  static getDerivedStateFromProps = (props, state) => {
    const { activeRegion } = props;
    if (activeRegion.key !== state.previousActiveRegionKey) {
      return {
        ...state,
        previousActiveRegionKey: activeRegion.key
      };
    }
    return null;
  };

  componentDidMount() {
    // check for GL support
    if (!mgl.supported({ failIfMajorPerformanceCaveat: true })) {
      this.setState({ unsupported: true });
      console.log("mapbox gl unsupported");
      return;
    }

    const map = (window.glMap = this.map = new mgl.Map({
      container: this.refs.node,
      center: [79.667, 20.018],
      zoom: 2.5,
      minZoom: 2.5,
      maxZoom: 12.5,
      dragRotate: false,
      doubleClickZoom: false,
      attributionControl: false,
      style: "mapbox://styles/devseed/cigvhb50e00039om3c86zjyco"
    }));

    map.on("load", () => {
      // Interaction handlers
      map.on("mousemove", this.onMouseMove);
      map.on("click", this.onClick);

      // Setup a GeoJSON source to use to power the emphasized (hover) feature
      // styling.
      const emphasizedFeatureSource = {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      };
      map.addSource("emphasis-features", emphasizedFeatureSource);

      // Setup a GeoJSON source to use for showing all the villages within a
      // district.
      const districtVillagesSource = {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        buffer: 128
      };
      map.addSource("district-villages", districtVillagesSource);

      // Setup a GeoJSON source to use for showing the currently selected
      // (plotted) villages
      const selectedVillagesSource = {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        buffer: 128
      };
      map.addSource("selected-villages-source", selectedVillagesSource);

      // Monkey-patch some fill layers.
      // Newer versions of GL don't recognize mouseover events on line layers,
      // unless you're actually hovering over the line.
      const boundarySource = {
        type: "vector",
        url: "mapbox://devseed.08hn3z6b"
      };

      map.addLayer(
        {
          id: "states-fill",
          type: "fill",
          source: Object.assign({}, boundarySource),
          "source-layer": "states",
          paint: {
            "fill-opacity": 0
          }
        },
        "states"
      );

      map.addLayer(
        {
          id: "current-state-districts-fill",
          type: "fill",
          source: Object.assign({}, boundarySource),
          "source-layer": "districts",
          paint: {
            "fill-opacity": 0
          }
        },
        "current-state-districts"
      );

      // Setup the color scale for the village light visualization: this is
      // actually a series of N separate layers, each with a different color.
      // `setFilters` makes it so that each one only applies to points with
      // the relevant range of `vis_median` values.

      let base = Object.assign({}, map.getLayer("villages-base"));

      // The new mapbox GL spec doesn't return a valid paint object, instead
      // populating it with internal values, so replace it.
      base.paint = {
        "circle-color": "#efc20d",
        "circle-blur": {
          base: 1,
          stops: [[5, 0.666], [8, 1.25]]
        },
        "circle-radius": {
          base: 1,
          stops: [[0, 2.5], [3, 5], [10, 8]]
        }
      };
      showLayer(map, "villages-base", false);

      // 1. the 'lightsX' layers, which style the vector tile village points
      // used in national and state view.
      lightStyles
        .create(base, "lights", {}, stops.length)
        .forEach(layer => map.addLayer(layer, "cities"));
      this.setLightFilters();

      // 2. the 'district-lightsX' layers, which will style the geojson source
      // of villages in district view.
      lightStyles
        .create(
          base,
          "district-lights",
          {
            source: "district-villages"
          },
          stops.length
        )
        .forEach(layer => {
          layer.interactive = true;
          // since this is a geojson layer, remove the source-layer
          delete layer["source-layer"];
          map.addLayer(layer, "cities");
        });

      // 3. the 'rggvy-lightsX' layers, which will style the same geojson
      // source as 2, but filtered only for rggvy villages.
      lightStyles
        .create(
          base,
          "rggvy-lights",
          {
            source: "district-villages",
            visibility: "none"
          },
          stops.length
        )
        .forEach(layer => {
          delete layer["source-layer"];
          map.addLayer(layer, "cities");
        });

      // Add style for selected villages
      var selectedVillages = cloneVillageLayer(
        base,
        "selected-villages",
        "selected-villages-source",
        "#e64b3b"
      );
      delete selectedVillages["source-layer"];
      map.addLayer(selectedVillages, "cities");

      // Add style for emphasized features
      map.addLayer(
        {
          id: "emphasis",
          type: "line",
          source: "emphasis-features",
          paint: {
            "line-color": "#fff",
            "line-width": {
              base: 1,
              stops: [[1, 0.5], [6, 1], [12, 1.5]]
            }
          }
        },
        "cities"
      );

      var emVillages = cloneVillageLayer(
        base,
        "emphasis-villages",
        "emphasis-features",
        "#fff"
      );
      delete emVillages["source-layer"];
      map.addLayer(emVillages, "cities");

      if (this.mapQueue.length) {
        this.mapQueue.forEach(fn => fn.call(this));
      }
      this.mapQueue = null;
      this.setState({ loaded: true });
    });
  }

  componentDidUpdate(prevProps) {
    const { activeRegion, match } = this.props;

    if (
      !activeRegion.loading &&
      activeRegion.key !== prevProps.activeRegion.key
    ) {
      this.callOnMap(() => {
        this.setRegionStyles(activeRegion);
        this.flyToRegion(activeRegion);
      });
    }

    if (activeRegion.emphasized !== prevProps.activeRegion.emphasized) {
      this.setEmphasized(activeRegion);
    }

    const { year, month } = match.params;
    const prev = prevProps.match.params;
    if (year !== prev.year || month !== prev.month) {
      this.setLightFilters();
    }
  }

  componentWillUnmount() {
    this.map.remove();
  }

  setLightFilters() {
    // const { year, month } = this.props.match.params;
    // const regionFilter = this.props.activeRegion.state
    //   ? [["==", "skey", this.props.activeRegion.state]]
    //   : [];
    // const property = `${year}-${month}`;
    // lightStyles.setFilters(this.map, "lights", stops, property, regionFilter);
  }

  /**
   * Takes either a screen coordinate (e.g. from a mouse event) or a
   * GeoJSON Feature (e.g. a polygon) as the location at which to show
   * the tooltip
   */
  showTooltip(pointOrFeature) {
    // determine location for the popup
    // let point;
    // if (pointOrFeature.type === "Feature") {
    //   let cent = centroid(pointOrFeature);
    //   point = cent.geometry.coordinates;
    // } else if (
    //   pointOrFeature.type === "FeatureCollection" &&
    //   (pointOrFeature.features || []).length > 0
    // ) {
    //   let cent = centroid(pointOrFeature);
    //   point = cent.geometry.coordinates;
    // } else {
    //   if (
    //     !this.props.activeRegion.emphasized ||
    //     this.props.activeRegion.emphasized.length === 0
    //   ) {
    //     return;
    //   }
    //   point = this.map.unproject(pointOrFeature);
    // }
    // // remove old popup if it exists
    // if (this._tooltip) {
    //   this._tooltip.remove();
    //   this._tooltip = null;
    // }
    // // add tooltip
    // let content = document.createElement("div");
    // render(
    //   <Tooltip region={this.props.activeRegion} villages={this.state.villages} />,
    //   content
    // );
    // this._tooltip = new mgl.Popup({ closeOnClick: false })
    //   .setLngLat(point)
    //   .setDOMContent(content.children[0]);
    // this._tooltip.addTo(this.map);
  }

  onMouseMove({ point }) {
    const { activeRegion } = this.props;
    let subregionPattern = {
      nation: /^states-fill/,
      state: /^current-state-districts-fill/,
      district: /^(district-lights|rggvy-lights)/
    }[activeRegion.level];
    const features = this.map.queryRenderedFeatures(point);
    if (features.length) {
      let subregionFeatures = features.filter(feat =>
        subregionPattern.test(feat.layer.id)
      );
      this.props.emphasize(subregionFeatures.map(feat => feat.properties.key));
      // if any of these features have a key that maches the current region,
      // then we know that the mouse is within the current activeRegion.
      let currentRegionHover = features
        .map(f => f.properties.key && f.properties.key === activeRegion.key)
        .reduce((a, b) => a || b, false);

      this.setState({ currentRegionHover });

      if (subregionFeatures.length > 0) {
        this.showTooltip(point);
      }
    }
  }

  flyToNation() {
    this.map.flyTo({
      center: [79.667, 20.018],
      zoom: 3.5,
      speed: 1.2,
      curve: 1.42
    });
  }

  flyToRegion(region) {
    if (region.boundary) {
      this.flyToFeature({ type: "Feature", geometry: region.boundary });
    } else {
      this.flyToNation();
    }
  }

  flyToFeature(feature) {
    let [minx, miny, maxx, maxy] = bbox(feature);
    this.map.fitBounds([[minx, miny], [maxx, maxy]], {
      speed: 1.2,
      curve: 1.42
    });
  }

  updateMap() {
    const { activeRegion } = this.props;

    // Enable/disable state borders
    const showStatesLayer =
      ["nation", "state"].indexOf(activeRegion.level) > -1;
    this.map.setLayoutProperty(
      "states",
      "visibility",
      showStatesLayer ? "visible" : "none"
    );

    // Distinguish districts of the current state, or just the current
    // district if we're in district view.
    const filters = [["==", "state_key", activeRegion.state_key]];
    if (activeRegion.level === "district") {
      filters.push(["==", "key", activeRegion.key]);
    }
    this.map.setFilter("districts", ["none"].concat(filters));
    this.map.setFilter("current-state-districts", ["all"].concat(filters));

    console.log(this.map.getStyle());
  }

  callOnMap(fn) {
    if (this.state.loaded) {
      fn.call(this);
    } else {
      this.mapQueue.push(fn);
    }
  }

  /**
   * Set the appropriate map styles for the given region.  This is a lower-
   * level method that does NOT check whether we're already at the given
   * region
   */
  setRegionStyles(region) {
    const visibility = {
      "current-state-districts": ["district", "state"],
      states: ["nation", "state"]
    };
    for (let layer in visibility) {
      let visible = visibility[layer].indexOf(region.level) >= 0;
      showLayer(this.map, layer, visible);
    }
    if (region.state) {
      // Distinguish districts of the current state, or just the current
      // district if we're in district view.
      let filters = [["==", "state_key", region.state]];
      if (region.level === "district") {
        filters.push(["==", "key", region.district]);
      }
      this.map.setFilter("districts", ["none"].concat(filters));
      this.map.setFilter("current-state-districts", ["all"].concat(filters));
    }

    lightStyles.forEach("lights", stops, layer => {
      showLayer(this.map, layer, !region.district);
    });
  }

  /**
   * Update the emphasized region source
   */
  setEmphasized(region) {
    const { district, emphasized, subregions } = region;
    const key =
      Array.isArray(emphasized) && emphasized.length ? emphasized[0] : null;
    const type = "FeatureCollection";
    const source = this.map.getSource("emphasis-features");
    if (!key) {
      this.callOnMap(() => {
        source.setData({ type, features: [] });
      });
    } else {
      if (district && this.state.villages.data) {
        const { features } = this.state.villages.data;
        this.callOnMap(() => {
          source.setData({
            type,
            features: features.filter(
              f => emphasized.indexOf(f.properties.key) >= 0
            )
          });
          showLayer(this.map, "emphasis-villages", true);
          showLayer(this.map, "emphasis", false);
        });
      } else if (subregions[key]) {
        source.setData({ type: "Feature", geometry: subregions[key].geometry });
        showLayer(this.map, "emphasis-villages", false);
        showLayer(this.map, "emphasis", true);
      }
    }
  }

  render() {
    const { activeRegion} = this.props;

    const cn = classnames("light-map", {
      ["light-map_" + this.props.compareMode]: this.props.compareMode
    });

    if (this.state.unsupported) {
      return (
        <div className={cn}>
          <Modal
            isOn
            isPermanent
            content={{
              title: <h1>WebGL Not Supported</h1>,
              body: (
                <p>
                  The visualizations on this site require a browser with WebGL
                  rendering capabilities. Please try viewing it with a newer
                  version of <a href="http://www.google.com/chrome/">Chrome</a>,{" "}
                  <a href="https://www.mozilla.org/en-US/firefox/new/">
                    Firefox
                  </a>
                  , or Safari.
                </p>
              )
            }}
          />
        </div>
      );
    }

    let loading = !this.state.loaded || activeRegion.loading;
    let errors =
      !activeRegion || !this.state.villages
        ? []
        : [activeRegion, this.state.villages].map(s => s.error);

    return (
      <div className={cn}>
        {loading ? <Loading errors={errors} /> : ""}
        <div className="map-inner" ref="node" />
      </div>
    );
  }
}

LightMap.propTypes = {
  // time: t.object.isRequired,
  // match: t.object,

  // select: t.func,

  // villages: t.object,

  // rggvyFocus: t.bool,
  // onMapCreated: t.func.isRequired,
  compareMode: t.oneOf(["left", "right", false])
};

const mapStateToProps = state => {
  return {
    activeRegion: state.activeRegion
  };
};

const mapDispatchToProps = {
  emphasize
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(LightMap)
);
