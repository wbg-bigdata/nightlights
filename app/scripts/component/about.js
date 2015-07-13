let React = require('react');
let Markdown = require('./markdown');
let fs = require('fs');
let path = require('path');

let content = fs.readFileSync(path.resolve(__dirname, '../../about.md'));

let Data = React.createClass({

  componentDidMount () {
    document.body.className = document.body.className + ' light-theme';
  },

  componentWillUnmount () {
    document.body.className = document.body.className.replace('light-theme', '');
  },

  render () {
    return (
      <article className='page single about'>
        <header className='page-header'>
          <div className='inner'>
            <div className='page-headline'>
              <h1 className='page-title'>About</h1>
            </div>
          </div>
        </header>
        <div className='page-body'>
          <div className='inner'>
            <div className='prose'>
              <Markdown>{content.toString()}</Markdown>
            </div>
          </div>
        </div>
        <footer className='page-footer'>
          <div className='inner'>
            <ul className='credits-list'>
              <li className='wbg-logo-wrapper'><a href='http://www.worldbank.org/' title='Visit The World Bank'><img alt='The World Bank logo' src='graphics/layout/wbg-logo-neg.svg' width='160' height='32' /><span>The World Bank</span></a></li>
              <li className='ds-logo-wrapper'><a href='https://developmentseed.org/' title='Visit Development Seed'><img alt='Development Seed logo' src='graphics/layout/ds-logo-neg.svg' width='188' height='32' /><span>Development Seed</span></a></li>
            </ul>
          </div>
        </footer>
      </article>
    );
  }
});

Data.displayName = 'Open Data';

module.exports = Data;
