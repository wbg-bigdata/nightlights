const React = require('react');
const t = require('prop-types');
const cookie = require('cookie-cutter');

class Modal extends React.Component {
  constructor (props) {
    super(props);
    let hasPlayed = props.cookieKey && cookie.get(props.cookieKey);
    this.state = {
      closed: !!hasPlayed,
      active: false
    };
  }

  // If we've already closed it once, never open it again.
  componentWillReceiveProps (props) {
    if (!this.state.closed) {
      this.setState({active: props.isOn});
    }
  }

  componentWillUnmount () {
    this.props.cookieKey && cookie.set(this.props.cookieKey, true);
  }

  close () {
    if (this.props.isPermanent) { return; }
    this.props.cookieKey && cookie.set(this.props.cookieKey, true);
    this.setState({
      closed: true,
      active: false
    });
  }

  render () {
    function stopClick (e) { e.stopPropagation(); }
    let content = this.props.content;
    let {title, body} = content;
    let className = this.state.closed
      ? 'modal destroyed'
      : this.state.active ? 'modal active' : 'modal';
    return (
      <div className={className} onClick={this.close.bind(this)}>
        <div className='modal-content' onClick={stopClick}>
          {title}
          {body}
          {this.props.isPermanent
            ? ''
            : <span className='close-modal' onClick={this.close.bind(this)} title='Close'><span>Close</span></span>
          }
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  isOn: t.bool.isRequired,
  content: t.object.isRequired,
  cookieKey: t.string,
  isPermanent: t.bool
};
module.exports = Modal;
