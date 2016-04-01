'use strict';

require('./console-message')();

var React = require('react');
var Router = require('react-router');
var Redirect = Router.Redirect;
var Route = Router.Route;
var difference = require('lodash.difference');
var union = require('lodash.union');

var Actions = require('./actions');
var App = require('./component/app');
var DataExplorer = require('./component/data-explorer');
var StoryHub = require('./component/story-hub');
var About = require('./component/about');

let timespan = require('./lib/timespan');

var routes = (
  <Route name='app' path='/' handler={App}>

    <Route name='nation'
      path='nation/:year/:month' handler={DataExplorer}/>

    <Route name='state'
      path='/state/:state/:year/:month'
      handler={DataExplorer}/>

    <Route name='district'
      path='/state/:state/district/:district/:year/:month'
      handler={DataExplorer}/>

    <Route name='stories'
      path='stories'
      handler={StoryHub} />

    <Route name='story'
      path='stories/:story'
      handler={StoryHub} />

    <Route name='about'
      path='about'
      handler={About} />

    <Redirect from='*' to='nation'
      params={{
        year: 2006,
        month: 12
      }}/>
  </Route>
);

var router = Router.create({
  routes,
  location: Router.HashLocation
});

router.run((Root, routeState) => {
  React.render(<Root/>, document.getElementById('site-canvas'));
});

// When the user selects a region (`key`), go to the appropriate route.
Actions.select.listen(function (key) {
  let params = router.getCurrentParams();
  let query = router.getCurrentQuery();
  if (!key) { router.transitionTo('nation', params, query); }
  let route = params.state ? 'district' : 'state';
  router.transitionTo(route, Object.assign(params, {
    state: params.state || key,
    district: params.state ? key : undefined
  }), query);
});

// When user wants to 'escape' from the current region, go up by one
// admin level
Actions.selectParent.listen(function () {
  let {state, district, year, month} = router.getCurrentParams();
  // if we're already up at nation view, do nothing
  if (!state) { return; }
  // navigate up from district to state, or from state to nation
  var route = district ? 'state' : 'nation';
  router.transitionTo(route, {
    state: district ? state : undefined,
    year,
    month
  }, router.getCurrentQuery());
});

// When user changes the date, update the appropriate route params
Actions.selectDate.listen(function ({year, month, compare}) {
  let params = router.getCurrentParams();
  let query = router.getCurrentQuery();
  let routes = router.getCurrentRoutes();
  let route = routes[routes.length - 1].name;
  if (typeof compare === 'undefined') {
    Object.assign(params, {year, month});
  } else if (compare) {
    Object.assign(query, {compare: `${year}.${month}`});
  } else {
    delete query.compare;
  }
  router.transitionTo(route, params, query);
});

Actions.toggleCompareMode.listen(function () {
  let query = router.getCurrentQuery();
  if (query.compare) {
    Actions.selectDate({compare: false});
  } else {
    Actions.selectDate(Object.assign({compare: true}, timespan.end));
  }
});

Actions.selectVillages.listen(function (villagecodes) {
  let query = router.getCurrentQuery();
  let villages = union(villagecodes, query.v || []);
  setVillages(villages);
});

Actions.unselectVillages.listen(function (villagecodes) {
  let query = router.getCurrentQuery();
  let villages = difference(query.v || [], villagecodes);
  setVillages(villages);
});

function setVillages (villages) {
  let routes = router.getCurrentRoutes();
  let route = routes[routes.length - 1].name;
  router.transitionTo(route, router.getCurrentParams(), Object.assign(router.getCurrentQuery(), { v: villages }));
}
