let React = require('react');
let widont = require('../lib/widont');

class Story extends React.Component {
  render () {
    let {previous, next} = this.props;
    return (
      <article className='page single stories' id={'story-' + this.props.slug}>
        <header className='page-header'>
          <div className='inner'>
            <div className='page-headline'>
              <h1 className='page-title'>{widont(this.props.title)}</h1>
              <sup className='page-suptitle'>Stories</sup>
            </div>
            <div className='page-actions'>
              <ul className='actions-menu'>
                <li className='all'><a href='#/stories' title='View all stories'><span>All</span></a></li>
                <li className='prev'><a href={'#/stories/' + previous.slug} title='View previous story'><span>Previous</span></a></li>
                <li className='next'><a href={'#/stories/' + next.slug}  title='View next story'><span>Next</span></a></li>
              </ul>
            </div>
          </div>
        </header>
        <div className='page-body'>
          <div className='inner'>
            <div className='prose'>
              {this.props.children}
            </div>
          </div>
        </div>
      </article>
    );
  }
}

Story.displayName = 'Story';
Story.propTypes = {
  title: React.PropTypes.string,
  previous: React.PropTypes.string,
  next: React.PropTypes.string,
  children: React.PropTypes.node
};

module.exports = Story;
