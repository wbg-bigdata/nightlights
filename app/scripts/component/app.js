var React = require('react');
var Router = require('react-router');
var RouteHandler = Router.RouteHandler;
var Header = require('./header');

/**
 * Main application.  Subviews included at <RouteHandler />
 *
 * If what you're looking for isn't here, try `data.js`.
 */
class App extends React.Component {
  render () {
    return (
      <div>
        <Header />
        <main id='site-body' role='main'>
          <RouteHandler />
        </main>
      </div>
    );
  }
}

App.displayName = 'App';

module.exports = App;
