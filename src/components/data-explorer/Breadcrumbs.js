import React from "react";
import { connect } from "react-redux";
import {Link} from "react-router-dom";
import numeral from "numeral";

// Components
import Search from "./Search";

class Breadcrumbs extends React.Component {
  render() {
    const { level, name, properties, state_key } = this.props.activeRegion;

    // Get population
    let population = "Unknown";
    if (properties && !isNaN(properties.tot_pop)) {
      population = numeral(properties.tot_pop).format("0,0");
    }

    // Init breadcrumbs in an array to enable styling per hierarchy
    let breadcrumbs = [];

    if (level !== "nation") {
      breadcrumbs.push(<Link to='/explore/india/2006/12'>India</Link>);
    }

    if (level === "district") {
      breadcrumbs.push(<Link to={`/explore/india/state/${state_key}/2006/12`}>{this.props.state.name}</Link>);
    }

    breadcrumbs.push(
      <span>
        <a className="bttn-center-map" title={"Recenter map on " + name}>
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
  const { activeRegion } = state;
  const { state_key } = activeRegion;

  return {
    activeRegion,
    state: state_key && state.regions[state_key] // Populate state when key is defined
  };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Breadcrumbs);
