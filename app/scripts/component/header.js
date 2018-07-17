const { Link } = require('react-router-dom');

class Header extends React.Component {

  render () {
    return (
      <header id='site-header' role='banner'>
        <h1 id='site-title'><a href='#/' title='Twenty Years of India Lights'><span>Twenty Years of India Lights</span></a></h1>
        <nav id='site-prime-nav' role='navigation'>
          <ul className='global-menu'>
            <li><Link to='nation' params={{ year: 2006, month: 12 }}>Home</Link></li>
            <li><Link to='stories'>Stories</Link></li>
            <li><Link to='about'>About</Link></li>
            <li><a href="http://api.nightlights.io/">Data</a></li>
          </ul>
        </nav>
      </header>
    );
  }
}

Header.displayName = 'Header';

module.exports = Header;
