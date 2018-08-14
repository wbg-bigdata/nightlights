// Modules
import React, { Component } from 'react';

const { Link } = require('react-router-dom');

class Header extends Component {
  render () {
    return (
      <header id='site-header' className="clearfix" role='banner'>
        <h1 id='site-title'><a href='#/' title='Twenty Years of India Lights'><span>Twenty Years of India Lights</span></a></h1>
        <nav id='site-prime-nav' role='navigation'>
          <ul className='global-menu'>
            <li><Link to='nation' params={{ year: 2006, month: 12 }}>Home</Link></li>
            <li><Link to='stories'>Stories</Link></li>
            <li><Link to='about'>About</Link></li>
            <li><a href='http://api.nightlights.io/'>Data</a></li>
          </ul>
        </nav>
      </header>
    );
  }
}

export default Header;
