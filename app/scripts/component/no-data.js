let React = require('react');

class NoData extends React.Component {
  render () {
    let className = this.props.noData ? 'no-data active' : 'no-data';
    return (
      <div className={className}>
        <p><strong>Are the lights out?</strong></p>
        <p>It could be cloud cover, moonsoon season, or <a>other reasons.</a></p>
      </div>
    );
  }
}

NoData.displayName = 'NoData';
NoData.propTypes = {
  noData: React.PropTypes.bool
};
module.exports = NoData;
