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
    this.unsubscribe.push(RegionListStore.listen(data => {
      /* eslint react/no-did-mount-set-state: [2, "allow-in-func"] */
      this.setState({ fuse: fuse(data) });
    }));
  },
  componentDidUnmount () { this.unsubscribe.forEach(u => u()); },
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
      if (!best || !best.name) {
        var node = React.findDOMNode(this.refs.search);
        // Remove error class.
        node.className = node.className.replace(/ ?no-results/, '');
        // Add it back on next tick so that css animation is triggered.
        setTimeout(function () { node.className += ' no-results'; }, 1);
        return;
      }
      // if the value in the search box exactly equals the best suggestion
      // then just go there.
      if (this.state.currentValue === best.name) {
        this.go(best);
      } else if (best.name) {
      // otherwise, complete the value in the input, so that hitting enter
      // again will navigate
        this.setState({currentValue: best.name});
      }
    }
  },

  getSuggestions (input, callback) {
    let suggestions = this.state.fuse.search(input);
    suggestions.sort((a, b) => {
      let diff = a.score - b.score;
      return diff || (a.item.name < b.item.name ? -1 : 1);
    });
    suggestions = suggestions.map(s => s.item);

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
        <label htmlFor='search-input'><span>Where</span></label>
        <Autosuggest suggestions={this.getSuggestions}
          suggestionRenderer={s => s.name}
          suggestionValue={s => s.name}
          onSuggestionSelected={s => this.go(s)}
          value={this.state.currentValue}
          scrollBar
          inputAttributes={{
            id: 'search-input',
            name: 'search-input',
            placeholder: 'Enter region...',
            type: 'search',
            onKeyPress: this.onKeyPress,
            onChange: value => this.setState({ currentValue: value })
          }}
          />
      </div>
    );
  }
});

module.exports = Search;
