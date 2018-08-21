import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

// Components
import Breadcrumbs from "./breadcrumbs";

class DataExplorer extends React.Component {
  render() {
    const { compare } = this.props;
    return (
      <div className={classnames("data-container", { compare: !!compare })}>
        <Breadcrumbs />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    compare: state.context.compare,
    region: state.region
  };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DataExplorer);
