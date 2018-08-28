import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import t from "prop-types";
import bbox from "@turf/bbox";

// Config
import config from "../../config";

// Styles: MapboxGL CSS is conflicting with current app styles, leaving comented for now
// import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox GL
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = config.mapboxAccessToken;

class LightMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previousSelectedRegionName: ""
    };

    // Bindings
    this.flyToNation = this.flyToNation.bind(this);
    this.flyToRegion = this.flyToRegion.bind(this);
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

  static getDerivedStateFromProps = (props, state) => {
    if (props.selectedRegion.name !== state.previousSelectedRegionName) {
      const newName = props.selectedRegion.name;
      return {
        ...state,
        previousSelectedRegionName: newName,
        value: newName
      };
    }
    return null;
  };

  componentDidUpdate() {
    this.flyToRegion(this.props.selectedRegion);
  }

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
      this.flyToRegion(this.props.selectedRegion);
    });
  }

  componentWillUnmount() {
    this.map.remove();
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
    selectedRegion: state.selectedRegion
  };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LightMap);
