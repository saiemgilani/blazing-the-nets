import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import firebase from './../firebase.js';

class TeamsList extends Component {
  constructor() {
    super();
    this.state = {
      username: '',
      teamName: '',
      teams: []
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const teamsRef = firebase.database().ref('teams');
    teamsRef.on('value', (snapshot) => {
      let teams = snapshot.val();
      let newState = [];
      for(let team in teams) {
        newState.push({
          id: team,
          captain: teams[team].captain,
          teamName: teams[team].teamName
        });
      }
      this.setState({
        teams: newState
      });
    });
  }

  removeTeam(teamId) {
    const teamRef = firebase.database().ref(`/teams/${teamId}`);
    teamRef.remove();
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  handleSubmit(e) {
    e.preventDefault();
    const teamRef = firebase.database().ref('teams');
    const team = {
      captain: this.state.username,
      teamName: this.state.teamName
    }
    teamRef.push(team);
    this.setState({
      teamName: '',
      username: ''
    });
  }

  render() {
    return(
      <div className="container">
        <div className="game-body">
          <section className="display-team">
            <ul>
              {this.state.teams.map((team) => {
                return (
                  <li key={team.id}>
                    <Link to={`/teams/${team.id}`}>
                      <h3>{team.teamName}</h3>
                    </Link>
                    <p>Captain: {team.captain}</p>
                    <button onClick={()=> this.removeTeam(team.id)}>Remove Team</button>
                  </li>
                )
              })}
            </ul>
          </section>
          <section className="add-team">
            <form onSubmit={this.handleSubmit} >
              <input type="text" name="username" placeholder="Your Name" value={this.state.username} onChange={this.handleChange} />
              <input type="text" name="teamName" placeholder="Team Name" value={this.state.teamName} onChange={this.handleChange} />
              <button>Create Team</button>
            </form>
          </section>
        </div>
      </div>
    );
  }
}

export default TeamsList;
