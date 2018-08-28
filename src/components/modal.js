import React from "react";

class Modal extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    e.stopPropagation();
    this.props.onClick();
  }


  render() {
    const { isActive, title, body } = this.props;
    return isActive ? (
      <div className={"modal active"} onClick={this.onClick}>
        <div className="modal-content" onClick={this.onClick}>
          {title}
          {body}
          {this.props.isPermanent ? (
            ""
          ) : (
            <span
              className="close-modal"
              onClick={this.onClick}
              title="Close"
            >
              <span>Close</span>
            </span>
          )}
        </div>
      </div>
    ) : null;
  }
}

export default Modal;
