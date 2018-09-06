import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import classnames from "classnames";

// Components
import Breadcrumbs from "./Breadcrumbs";
import LightMap from "./LightMap";
import LightCurves from "./LightCurves";

// Actions
import { setActiveRegion } from "../../actions/regions";

class DataExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previousMatchUrl: null
    };
  }

  static getDerivedStateFromProps = (props, state) => {
    const { match } = props;
    if (match && match.url !== state.previousMatchUrl) {
      const { nation, state, district } = match.params;
      if (district) {
        props.setActiveRegion({
          level: "district",
          key: district
        });
      } else if (state) {
        props.setActiveRegion({
          level: "state",
          key: state
        });
      } else {
        props.setActiveRegion({
          level: "nation",
          key: nation
        });
      }
      return {
        previousMatchUrl: match.url
      };
    }
    return null;
  };

  render() {
    const { compare } = this.props;
    return (
      <div className={classnames("data-container", { compare: !!compare })}>
        <Breadcrumbs />
        <LightMap />
        <LightCurves />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    compare: state.context.compare,
    activeRegion: state.activeRegion
  };
};

const mapDispatchToProps = {
  setActiveRegion
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(DataExplorer)
);
