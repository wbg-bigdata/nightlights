var React = require('react');
var Header = require('./header');
class App extends React.Component {
  render () {
    return (
      <div>
        <Header />
        <main id='site-body' role='main'>
          {this.props.children}
        </main>
      </div>
    );
  }
}
module.exports = App;
