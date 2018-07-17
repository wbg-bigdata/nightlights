const React = require('react');
const t = require('prop-types');
const Markdown = require('remarkable');

var Remarkable = React.createClass({
  content () {
    return this.props.children.map(child => {
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
  },

  render () {
    return (
      <div>
        {this.content()}
      </div>
    );
  },
});
export default Remarkable;
