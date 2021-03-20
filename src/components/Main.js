import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import Home from './Home';
import Teams from './Teams';

class Main extends Component {
  render() {
    return(
      <main>
        <Switch>
          <Route exact path='/' component={Home} />
          <Route path='/teams' component={Teams} />
        </Switch>
      </main>
    );
  }
}

export default Main;
