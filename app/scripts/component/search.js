let React = require('react');
let Router = require('react-router');
import Autosuggest from 'react-autosuggest';
let RegionListStore = require('../store/region-list');
let Fuse = require('fuse.js');

function fuse (data) {
  return new Fuse(data.regions, {
    keys: ['name'],
    maxPatternLength: 64,
    include: ['score']
  });
}

let Search = React.createClass({
  displayName: 'Search',
  propTypes: {
    children: React.PropTypes.node,
    initialValue: React.PropTypes.string
  },

  mixins: [Router.State, Router.Navigation],

  getInitialState () {
    return {
      active: true,
      currentValue: '',
      fuse: fuse(RegionListStore.getInitialState())
    };
  },

  componentDidMount () {
    this.unsubscribe = [];
    this.unsubscribe.push(RegionListStore.listen((data) => {
      /* eslint react/no-did-mount-set-state: [2, "allow-in-func"] */
      this.setState({ fuse: fuse(data) });
    }));
  },

  componentDidUnmount () { this.unsubscribe.forEach((u) => u()); },
  onClick () {
    this.setState({active: true});
  },
  componentWillReceiveProps (nextProps) {
    this.setState({currentValue: nextProps.initialValue});
  },

  onKeyPress (event) {
    if (event.which === 13) {
      // enter key
      let best = this.getSuggestions(this.state.currentValue)[0];
      if (!best || !best.name) { return this.onNotFound(); }
      // if the value in the search box exactly equals the best suggestion
      // then just go there.
      if (this.state.currentValue === best.name) {
        this.onSubmit();
      } else if (best.name) {
      // otherwise, complete the value in the input, so that hitting enter
      // again will navigate
        this.setState({currentValue: best.name});
      }
    }
  },

  onNotFound () {
    var node = React.findDOMNode(this.refs.search);
    // Remove error class.
    node.className = node.className.replace(/ ?no-results/, '');
    // Add it back on next tick so that css animation is triggered.
    setTimeout(function () { node.className += ' no-results'; }, 1);
  },

  onReset (e) {
    e.preventDefault();
    this.setState({currentValue: ''});
    let node = React.findDOMNode(this);
    node.querySelector('#search-input').focus();
  },

  onSubmit () {
    let best = this.getSuggestions(this.state.currentValue)[0];
    if (!best || !best.name) { return this.onNotFound(); }
    this.go(best);
  },

  getSuggestions (input, callback) {
    let suggestions = this.state.fuse.search(input);
    suggestions.sort((a, b) => {
      let diff = a.score - b.score;
      return diff || (a.item.name < b.item.name ? -1 : 1);
    });
    suggestions = suggestions.map((s) => s.item);

    if (callback) {
      callback(null, suggestions);
    }
    return suggestions;
  },

  go (region) {
    let {year, month} = this.getParams();
    let params = {
      year,
      month,
      state: region.type === 'state' ? region.key : region.state,
      district: region.type === 'state' ? undefined : region.key
    };
    this.transitionTo(region.type, params, this.getQuery());
  },

  render () {
    return (
      <div className='search' ref='search'>
        <a href='#' onClick={this.onReset} className='bttn-clear-search'>
          <span>Clear Search</span>
        </a>
        <a className='bttn-search'
          onClick={this.onSubmit}
          title='Search'>
          <span>Search</span>
        </a>
        <label htmlFor='search-input'><span>Where</span></label>
        <Autosuggest suggestions={this.getSuggestions}
          suggestionRenderer={getName}
          suggestionValue={getName}
          onSuggestionSelected={this.go}
          value={this.state.currentValue}
          scrollBar
          inputAttributes={{
            id: 'search-input',
            name: 'search-input',
            placeholder: 'Enter region...',
            type: 'search',
            onKeyPress: this.onKeyPress,
            onChange: (value) => this.setState({ currentValue: value })
          }}
          />
      </div>
    );
  }
});

function getName (s) { return s.name; }

module.exports = Search;
