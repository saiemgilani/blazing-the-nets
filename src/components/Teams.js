import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';

import TeamsList from './TeamsList.js';
import Team from './Team.js';

class Teams extends Component {
  render() {
    return(
      <Switch>
        <Route exact path='/teams' component={TeamsList} />
        <Route path='/teams/:id' component={Team} />
      </Switch>
    );
  }
}

export default Teams;
