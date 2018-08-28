const React = require('react');
const t = require('prop-types');

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

NoData.propTypes = {
  noData: t.bool
};
module.exports = NoData;
