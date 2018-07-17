const React = require('react');
class Markdown extends React.Component {
  render () {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
};
module.exports = Markdown;
