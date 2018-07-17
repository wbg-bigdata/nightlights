'use strict';

const React = require('react');
const { render } = require('react-dom');
const { HashRouter, Route, Switch, Redirect } = require('react-router-dom');
const difference = require('lodash.difference');
const union = require('lodash.union');

const Actions = require('./actions');
const App = require('./component/app');
const DataExplorer = require('./component/data-explorer');
const StoryHub = require('./component/story-hub');
const About = require('./component/about');

const DefaultRoute = ({...args}) => <Route {...args} render={() => <Redirect to='/nation/2006/12' />} />;

const Root = () => (
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
);

render(
  <Root />,
  document.getElementById('site-canvas')
);

// When the user selects a region (`key`), go to the appropriate route.
Actions.select.listen(function (key) {
  let {state, year, month} = router.getCurrentParams();
  let route = state ? 'district' : 'state';
  router.transitionTo(route, {
    state: state ? state : key,
    district: state ? key : undefined,
    year,
    month
  });
});

// When user wants to 'escape' from the current region, go up by one
// addmin level
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
  });
});

// When user changes the date, update the appropriate route params
Actions.selectDate.listen(function ({year, month}) {
  let {state, district} = router.getCurrentParams();
  let routes = router.getCurrentRoutes();
  let route = routes[routes.length - 1].name;
  router.transitionTo(route, {
    state,
    district,
    year,
    month
  });
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
  router.transitionTo(route, router.getCurrentParams(), { v: villages });
}
