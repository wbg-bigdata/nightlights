import React from "react";
import { connect } from "react-redux";
import { times, throttle } from "lodash";
import classnames from "classnames";
import t from "prop-types";
import bbox from "@turf/bbox";
import mapboxgl from "mapbox-gl";

// Config
import config from "../../config";
const stops = config.villageLightStops;
mapboxgl.accessToken = config.mapboxAccessToken;

// Styles: MapboxGL CSS is conflicting with current app styles, leaving comented for now
// import 'mapbox-gl/dist/mapbox-gl.css';

class LightMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previousActiveRegionKey: "not set"
    };

    // Bindings
    this.onMouseMove = this.onMouseMove.bind(this);
    this.flyToNation = this.flyToNation.bind(this);
    this.flyToRegion = this.flyToRegion.bind(this);
  }

  static getDerivedStateFromProps = (props, state) => {
    if (props.activeRegion.key !== state.previousActiveRegionKey) {
      return {
        ...state,
        previousActiveRegionKey: props.activeRegion.key
      };
    }
    return null;
  };

  componentDidMount() {
    // check for GL support
    if (!mapboxgl.supported({ failIfMajorPerformanceCaveat: true })) {
      this.setState({ unsupported: true });
      console.log("mapbox gl unsupported");
      return;
    }

    const map = (window.glMap = this.map = new mapboxgl.Map({
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

      // Disable default "villages-base" layer
      map.setLayoutProperty("villages-base", "visibility", "none");

      const villageBaseLayer = map
        .getStyle()
        .layers.filter(layer => layer.id === "villages-base")[0];

      // 1. the 'lightsX' layers, which style the vector tile village points
      // used in national and state view.
      times(stops.length, i => {
        const lightsXLayer = Object.assign({}, villageBaseLayer);
        lightsXLayer.id = "lights" + i;
        lightsXLayer.paint["circle-opacity"] = (i + 1) / stops.length;
        map.addLayer(lightsXLayer, "cities");
      });

      // 2. the 'district-lightsX' layers, which will style the geojson source
      // of villages in district view.
      times(stops.length, i => {
        const districtLightsXLayer = Object.assign({}, villageBaseLayer);
        districtLightsXLayer.id = "district-lights" + i;
        delete districtLightsXLayer["source-layer"];
        districtLightsXLayer["source"] = "district-villages";
        districtLightsXLayer.paint["circle-opacity"] = (i + 1) / stops.length;
        map.addLayer(districtLightsXLayer, "cities");
      });

      // 3. the 'rggvy-lightsX' layers, which will style the same geojson
      // source as 2, but filtered only for rggvy villages.
      times(stops.length, i => {
        const rggyLightsXLayer = Object.assign({}, villageBaseLayer);
        rggyLightsXLayer.id = "rggvy-lights" + i;
        delete rggyLightsXLayer["source-layer"];
        rggyLightsXLayer["source"] = "district-villages";
        rggyLightsXLayer.paint["circle-opacity"] = (i + 1) / stops.length;
        map.addLayer(rggyLightsXLayer, "cities");
      });

      // Add style for selected villages
      const selectedVillagesLayer = Object.assign({}, villageBaseLayer);
      selectedVillagesLayer.id = "selected-villages";
      delete selectedVillagesLayer["source-layer"];
      selectedVillagesLayer["source"] = "selected-villages-source";
      selectedVillagesLayer.paint["circle-color"] = "#e64b3b";
      selectedVillagesLayer.paint["circle-opacity"] = 1;
      selectedVillagesLayer.paint["circle-blur"] = 0;
      selectedVillagesLayer.paint[
        "circle-radius"
      ].stops = selectedVillagesLayer.paint["circle-radius"].stops.map(stop => [
        stop[0],
        stop[1] * 0.667
      ]);
      map.addLayer(selectedVillagesLayer, "cities");

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

      // Add style for selected villages
      const emphasisVillagesLayer = Object.assign({}, villageBaseLayer);
      emphasisVillagesLayer.id = "emphasis-villages";
      delete emphasisVillagesLayer["source-layer"];
      emphasisVillagesLayer["source"] = "emphasis-features";
      emphasisVillagesLayer.paint["circle-color"] = "#fff";
      emphasisVillagesLayer.paint["circle-opacity"] = 1;
      emphasisVillagesLayer.paint["circle-blur"] = 0;
      emphasisVillagesLayer.paint[
        "circle-radius"
      ].stops = emphasisVillagesLayer.paint["circle-radius"].stops.map(stop => [
        stop[0],
        stop[1] * 0.667
      ]);
      map.addLayer(emphasisVillagesLayer, "cities");

      map.on("mousemove", throttle(this.onMouseMove, 100));

      this.updateMap();

      this.flyToRegion(this.props.activeRegion);
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.activeRegion.key !== prevProps.activeRegion.key) {
      this.updateMap();
      this.flyToRegion(this.props.activeRegion);
    }
  }

  componentWillUnmount() {
    this.map.remove();
  }

  onMouseMove(e) {
    const bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
    const features = this.map.queryRenderedFeatures(bbox, {
      layer: "states",
      // filter: ["all", ["==", "key", "west-bengal"]]
    });
    console.log(features);
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

  updateEmphasized() {}

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

  render() {
    const cn = classnames("light-map", {
      ["light-map_" + this.props.compareMode]: this.props.compareMode
    });

    return (
      <div className={cn}>
        <div className="map-inner" ref="node" />
      </div>
    );
  }
}

LightMap.propTypes = {
  // time: t.object.isRequired,
  // match: t.object,

  // emphasize: t.func,
  // select: t.func,

  // region: t.object,
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

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LightMap);
