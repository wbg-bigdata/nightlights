const React = require('react');
const t = require('prop-types');

class Loading extends React.Component {
  render () {
    const errors = (this.props.errors || []).filter(e => e);
    if (errors.length > 0) {
      return <div className='error'>Oops! There was an error!</div>;
    }

    return (
    <div className='loading'>
      <div className='loader'>Loading...</div>
      <div className='message'>{this.props.message || ''}</div>
    </div>
    );
  }
}

Loading.propTypes = {
  message: t.string,
  errors: t.array.isRequired
};

module.exports = Loading;
