import React, { Component } from 'react';
import firebase from './../firebase.js';

class Team extends Component {

  constructor() {
    super();
    this.state = {
      id: '',
      teamName: '',
      name: '',
      players: []
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // Getting Team Name from firebase
    const teamRef = firebase.database().ref(`teams/${this.props.match.params.id}`);
    teamRef.on('value', (snapshot) => {
      console.log(snapshot.val());
      let teamName = snapshot.val().teamName;
      this.setState({
        teamName: teamName
      });
    });

    // Displaying all players in a team
    const playersRef = firebase.database().ref(`teams/${this.props.match.params.id}/players`);
    playersRef.on('value', (snapshot) => {
      //console.log(snapshot.val());
      let players = snapshot.val();
      let newState = [];
      for(let player in players) {
        newState.push({
          id: player,
          name: players[player].name,
        });
      }
      this.setState({
        players: newState
      });
    });

  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const playersRef = firebase.database().ref(`teams/${this.props.match.params.id}/players`);
    const player = {
      id: this.state.id,
      name: this.state.name
    }
    playersRef.push(player);
    this.setState({
      name: ''
    });
  }

  render() {
    console.log(this.props)
    return(
      <div className="container">
        <h1>Team: {this.state.teamName}</h1>
        <h2>Players: </h2>
        <section className="display-players">
          <div className="wrapper">
            <ul>
              {this.state.players.map((player) => {
                return(
                  <li key={player.id}>
                    <h3>{player.name}</h3>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
        <form onSubmit={this.handleSubmit}>
          <input type="text" name="name" placeholder="Your Name" onChange={this.handleChange} value={this.state.name} />
          <button>Add Player</button>
        </form>
      </div>
    );
  }
}

export default Team;
