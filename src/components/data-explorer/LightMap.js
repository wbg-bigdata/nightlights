import React from "react";
import classnames from "classnames";
import t from "prop-types";
import config from "../../config";

// Mapbox GL
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = config.mapboxAccessToken;

class LightMap extends React.Component {

  componentDidMount(){
    // check for GL support
    if (!mapboxgl.supported({failIfMajorPerformanceCaveat: true})) {
      this.setState({unsupported: true});
      console.log('mapbox gl unsupported');
      return;
    }

    const map = window.glMap = this.map = new mapboxgl.Map({
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
  compareMode: t.oneOf(['left', 'right', false])
};

export default LightMap;
