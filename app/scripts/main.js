'use strict';

const React = require('react');
const { render } = require('react-dom');
const { HashRouter, Route, Switch, Redirect } = require('react-router-dom');
const { Provider } = require('react-redux');
const difference = require('lodash.difference');
const union = require('lodash.union');

const store = require('./lib/store');
const Actions = require('./actions');
const App = require('./component/app');
const DataExplorer = require('./component/data-explorer');
const StoryHub = require('./component/story-hub');
const About = require('./component/about');
const timespan = require('./lib/timespan');

const DefaultRoute = ({...args}) => <Route {...args} render={() => <Redirect to='/nation/2006/12' />} />;

const Root = () => (
  <Provider store={store}>
    <HashRouter>
      <App>
        <Switch>
          <Route exact name='nation' path='/nation/:year/:month' component={DataExplorer} />
          <Route exact name='state' path='/state/:state/:year/:month' component={DataExplorer} />
          <Route exact name='district' path='/state/:state/district/:district/:year/:month' component={DataExplorer} />
          <Route name='stories' path='/stories' component={StoryHub} />
          <Route name='story' path='/stories/:story' component={StoryHub} />
          <Route name='about' path='/about' component={About} />
          <Route component={DefaultRoute} />
        </Switch>
      </App>
    </HashRouter>
  </Provider>
);

render(
  <Root />,
  document.getElementById('site-canvas')
);

/*
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
  let route = district ? 'state' : 'nation';
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
*/
