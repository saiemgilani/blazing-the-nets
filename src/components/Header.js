import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Header extends Component {
  render() {
    return(
      <header>
        <div className="container">
          <h1 className="App-title">Basketball Stat App</h1>
          <nav>
            <ul>
              <li><Link to='/'>Home</Link></li>
              <li><Link to='/teams'>Team</Link></li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }
}

export default Header;
