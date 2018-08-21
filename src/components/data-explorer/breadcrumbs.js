import React from "react";
import { connect } from "react-redux";

// Components
import Search from "./Search";

class Breadcrumbs extends React.Component {
  render() {
    const { level, stateName, name, population } = this.props.region;

    // Init breadcrumbs in an array to enable styling per hierarchy
    let breadcrumbs = [];

    if (level !== "nation") {
      breadcrumbs.push(<a>India</a>);
    }

    if (level === "district") {
      breadcrumbs.push(<a>{stateName}</a>);
    }

    breadcrumbs.push(
      <span>
        <a
          className="bttn-center-map"
          title={"Recenter map on " + name}
        >
          <span>{name}</span>
        </a>
      </span>
    );

    return (
      <div>
        <section className="spane region-detail">
          <ul>
            {breadcrumbs.map((b, i) => (
              <li key={`breadcrumb-${i}`} className="breadcrumbs">
                {b}
              </li>
            ))}
          </ul>
          <div className="spane-header">
            <h1 className="spane-title">{name}</h1>
            <Search initialValue={name} />
          </div>
          <div className="spane-body">
            <dl className="spane-details">
              <dt>Population (census 2011)</dt>
              <dd>{population}</dd>
            </dl>
          </div>
        </section>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    region: state.selectedRegion
  };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Breadcrumbs);
