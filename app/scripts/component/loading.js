let React = require('react');

class Loading extends React.Component {
  render () {
    let errors = (this.props.errors || []).filter(e => e);
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

Loading.displayName = 'Loading';
Loading.propTypes = {
  message: React.PropTypes.string,
  errors: React.PropTypes.array.isRequired
};

module.exports = Loading;
