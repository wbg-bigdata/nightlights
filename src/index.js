// Modules
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux';

// App
import App from './App';

// Components
import About from './components/about';
// import DataExplorer from './components/data-explorer';
import StoryHub from './components/story-hub';

// Libraries
import store from './lib/store';
import registerServiceWorker from './registerServiceWorker';

// Styles
import './index.css';

const DefaultRoute = ({...args}) => <Route {...args} render={() => <Redirect to='/nation/2006/12' />} />;

ReactDOM.render(<Provider store={store}>
    <HashRouter>
    <App>
        <Switch>
        {/* <Route exact name='nation' path='/nation/:year/:month' component={DataExplorer} />
        <Route exact name='state' path='/state/:state/:year/:month' component={DataExplorer} /> 
        <Route exact name='district' path='/state/:state/district/:district/:year/:month' component={DataExplorer} /> */}
        <Route name='stories' path='/stories' component={StoryHub} />
        <Route name='story' path='/stories/:story' component={StoryHub} />
        <Route name='about' path='/about' component={About} />
        <Route component={DefaultRoute} />
        </Switch>
    </App>
    </HashRouter>
</Provider>, document.getElementById('root'));

registerServiceWorker();
