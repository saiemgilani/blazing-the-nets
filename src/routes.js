import React from 'react';
import Layout from './HOC/Layout';
import { Switch } from 'react-router-dom';

// import PrivateRoute from './components/AuthRoutes/PrivateRoutes';
import PublicRoute from './components/AuthRoutes/PublicRoutes.js';
import ChartDashboard from './containers/ChartDashboard';

// import Home from './Components/Home';
import TeamChartDashboard from './containers/TeamChartDashboard';
import Login from './components/Login';

import NotFound from './components/UI/NotFound';
import { firebase } from './firebase';


const Routes = (props) => {
    return (
      <Layout user={props.user}> 
        <Switch>
          {/* <PrivateRoute {...props} exact path="/dashboard" component={Dashboard}/>
          <PrivateRoute {...props} exact path="/admin_games" component={AdminGames}/>
          <PrivateRoute {...props} exact path="/admin_games/edit_game/:id" component={AddEditGame}/>
          <PrivateRoute {...props} exact path="/admin_games/add_game" component={AddEditGame}/>
          <PrivateRoute {...props} exact path="/admin_players" component={AdminPlayers}/>
          <PrivateRoute {...props} exact path="/admin_players/edit_player/:id" component={AddEditPlayer}/>
          <PrivateRoute {...props} exact path="/admin_players/add_player" component={AddEditPlayer}/> */}
  
          <PublicRoute {...props} restricted={true} exact path="/login" component={Login}/>
          <PublicRoute {...props} restricted={false} exact path="/" component={ChartDashboard}/>
          <PublicRoute {...props} restricted={false} exact path="/players" component={ChartDashboard}/>
          <PublicRoute {...props} restricted={false} exact path="/players/:playerId" component={ChartDashboard}/>
          <PublicRoute {...props} restricted={false} exact path="/teams" component={TeamChartDashboard}/>
          <PublicRoute {...props} restricted={false} exact path="/teams/:teamId" component={TeamChartDashboard}/>
          {/* <PublicRoute {...props} restricted={false} exact path="/nba-team/player/:playerId" component={NbaPlayerInfo}/>
          <PublicRoute {...props} restricted={false} exact path="/nba-teams" component={NbaTeams}/>
          <PublicRoute {...props} restricted={false} exact path="/player-info/:id" component={PlayerInfo}/>
          <PublicRoute {...props} restricted={false} exact path="/team" component={Team}/>
          <PublicRoute {...props} restricted={false} exact path="/" component={Home}/>  */}
          <PublicRoute {...props} restricted={false} component={NotFound} />
        </Switch> 
      </Layout>
    )
  }
  
export default Routes;
  