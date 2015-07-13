let React = require('react');
let Markdown = require('../markdown');

let story = {
  slug: 'meta',
  title: '20 Years of Night Lights',
  introduction: 'Lorem ipsum intro.',

  body: (
<Markdown>{`

The meta story about messiness.

`}</Markdown>
  ),

  content: React.createClass({
    displayName: 'Content',
    render () { return story.body; }
  })
};

module.exports = story;
