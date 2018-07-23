const React = require('react');
const RegionStore = require('../store/region');
const Story = require('./story');
const widont = require('../lib/widont');

const stories = [
  require('./stories/diwali'),
  require('./stories/rggvy'),
  require('./stories/election')
];

class StoryHub extends React.Component {
  // mixins: [ Router.State ],

  constructor (props) {
    super(props);
    this.statics = {
      willTransitionTo (transition, params) {
        let story = params.story;
        let index = stories.map(s => s.slug).indexOf(story);
        if (stories[index] && stories[index].loadData) {
          RegionStore.setRegion(stories[index].loadData);
        }
      }
    };
  }

  componentDidMount () {
    document.body.className = document.body.className + ' light-theme';
  }

  componentWillUnmount () {
    document.body.className = document.body.className.replace('light-theme', '');
  }

  render () {
    let story = this.getParams().story;
    let index = stories.map((s) => s.slug).indexOf(story);

    if (stories[index]) {
      // Viewing Story article.
      let Content = stories[index].content;

      // Get previous/next articles
      let previous = (index === 0)
        ? stories[stories.length - 1]
        : stories[index - 1];

      let next = (index === stories.length - 1)
        ? stories[0]
        : stories[index + 1];

      return (
        <Story title={stories[index].title} slug={stories[index].slug} previous={previous} next={next}>
          <Content />
        </Story>
      );
    } else {
      // Viewing Stories hub.
      return (
        <section className='page hub stories'>
          <header className='page-header'>
            <div className='inner'>
              <div className='page-headline'>
                <h1 className='page-title'>Stories</h1>
              </div>
            </div>
          </header>
          <div className='page-body'>
            <ul className='summary-list'>
            {stories.map((story) => (
              <li className='summary-wrapper' key={story.slug}>
                <article className='summary'>
                  <header className='summary-header'>
                    <h1 className='summary-title'><Router.Link to='story' params={{story: story.slug}}>{widont(story.title)}</Router.Link></h1>
                  </header>
                  {story.introduction ? (
                    <div className='summary-body'>
                      <p>{story.introduction}</p>
                    </div>
                  ) : null}
                  <footer className='summary-footer'>
                    <Router.Link to='story' params={{story: story.slug}} className='bttn-more'><span>Read more</span></Router.Link>
                  </footer>
                </article>
              </li>
            ))}
            </ul>
          </div>
        </section>
      );
    }
  }
};

module.exports = StoryHub;
