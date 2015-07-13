import React from 'react';
import Markdown from 'remarkable';

var Remarkable = React.createClass({
  displayName: 'Markdown',
  propTypes: {
    children: React.PropTypes.node
  },

  render () {
    return (
      <div>
        {this.content()}
      </div>
    );
  },

  content () {
    return React.Children.map(this.props.children, child => {
      if (typeof child === 'string') {
        return <div className='prose-inner' dangerouslySetInnerHTML={{ __html: this.renderMarkdown(child) }} />;
      } else {
        return child;
      }
    });
  },

  renderMarkdown (source) {
    if (!this.md) { this.md = new Markdown({}); }
    return this.md.render(source);
  }

});

export default Remarkable;
