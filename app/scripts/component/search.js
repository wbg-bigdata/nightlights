let React = require('react');
let Router = require('react-router');
let assign = require('object-assign');
import Autosuggest from 'react-autosuggest';
let RegionListStore = require('../store/region-list');

let Search = React.createClass({
  displayName: 'Search',
  propTypes: {
    children: React.PropTypes.node,
    initialValue: React.PropTypes.string
  },

  mixins: [Router.State, Router.Navigation],

  getInitialState () {
    return assign({ active: true, currentValue: '' }, RegionListStore.getInitialState());
  },
  componentDidMount () {
    this.unsubscribe = [];
    this.unsubscribe.push(RegionListStore.listen(this.setState.bind(this)));
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
        console.log(node);
        // Remove error class.
        node.className = node.className.replace(/ ?no-results/, '');
        // Add it back on next tick.
        setTimeout(function() { node.className += ' no-results'; }, 1);
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
    const regex = new RegExp('^' + input, 'i');
    const suggestions = this.state.regions.filter(r => regex.test(r.name));

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
    this.transitionTo(region.type, params);
  },

  render () {
    return (
      <div className='search' ref="search">
        <label htmlFor="search-input"><span>Where</span></label>
        <Autosuggest suggestions={this.getSuggestions}
          suggestionRenderer={s => s.name}
          suggestionValue={s => s.name}
          onSuggestionSelected={s => this.go(s)}
          value={this.state.currentValue}
          scrollBar={true}
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
