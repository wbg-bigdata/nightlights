import React from "react";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";
import _ from "lodash";
import Autosuggest from "react-autosuggest";
import Fuse from "fuse.js";

// Dispach
import { setActiveRegion } from "../../actions/regions";

class Search extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: this.props.activeRegion.name,
      previousActiveRegionName: this.props.activeRegion.name,
      suggestions: [],
      fuse: new Fuse(this.props.regions, {
        keys: ["name"],
        includeScore: true,
        maxPatternLength: 64,
        include: ["score"]
      })
    };

    // Bindings
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.onClear = this.onClear.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  getSuggestions = input => {
    let suggestions = this.state.fuse.search(input);
    suggestions.sort((a, b) => {
      let diff = a.score - b.score;
      return diff || (a.item.name < b.item.name ? -1 : 1);
    });
    suggestions = suggestions.map(s => s.item);
    return suggestions;
  };

  onClear = e => {
    e.preventDefault();

    // Set suggestions based on current value
    const suggestions = this.state.fuse.search(this.state.value);
    this.setState({ value: "", suggestions });

    // Focus input
    const node = findDOMNode(this);
    node.querySelector("#search-input").focus();
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  onSuggestionsFetchRequested = ({ value, reason }) => {
    if (reason !== "suggestion-selected") {
      this.setState({
        suggestions: this.getSuggestions(value)
      });
    }
  };

  onBlur = () => {
    this.setState({
      value: this.props.activeRegion.name
    });
  };

  onChange = (event, { newValue, method }) => {
    if (method !== "click") {
      this.setState({
        value: newValue
      });
    }
  };

  onSuggestionSelected = (event, { suggestion }) => {
    this.props.setActiveRegion(suggestion);
    this.setState({
      value: suggestion.name,
      suggestions: []
    });
  };

  static getDerivedStateFromProps = (props, state) => {
    if (props.activeRegion.name !== state.previousActiveRegionName) {
      const newName = props.activeRegion.name;
      return {
        ...state,
        previousActiveRegionName: newName,
        value: newName
      };
    }
    return null;
  };

  render() {
    const { value, suggestions } = this.state;

    return (
      <div className="search" ref="search">
        <a onClick={this.onClear} className="bttn-clear-search">
          <span>Clear Search</span>
        </a>
        <a className="bttn-search" onClick={this.onSubmit} title="Search">
          <span>Search</span>
        </a>
        <label htmlFor="search-input">
          <span>Where</span>
        </label>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={suggestion => suggestion.name}
          renderSuggestion={suggestion => suggestion.name}
          alwaysRenderSuggestions={true}
          inputProps={{
            id: "search-input",
            value,
            placeholder: "Enter region...",
            onBlur: this.onBlur,
            onChange: this.onChange
          }}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    activeRegion: state.activeRegion,
    regions: _.values(state.regions)
  };
};

const mapDispatchToProps = {
  setActiveRegion
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
