const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');
const template = require("nba-client-template");
const path = require("path");

const fetch = require("node-fetch");
// so I had a really stupid time trying to read files from disk using async/await
// it resulted in me doing something i know is terribly stupid in delay20
let playersList = []
async function readFile(filePath) {
  try { 
    const data = await fsp.readFile(filePath);
    return data
  } catch (error) {
    console.error(`Got an error trying to read the file: ${error.message}`);
  }
}
function getPlayers(data){
  
  const players = JSON.parse(data);
  for(const player of players){
      playersList.push(player.playerId)
  }
};

let teamsList = []
function getTeams(data){
  const teams = JSON.parse(data);
  for(const team of teams){
      teamsList.push(team.teamId)
  }
};

function getRoster(data){
    
    let teamsRoster = []
    const players = JSON.parse(data)[0];
    for(const player of players){
        teamsRoster.push(player.PLAYER_ID)
    }
    return teamsRoster
};

async function readRosters(team, season){

    const rosters = await readFile(`../public/data/teamrosters/${season}/${team}.json`);
    const teamsRoster = getRoster(rosters);
    return teamsRoster
}
async function delay() {
  const durationMs = Math.random() * 3 * 800 + 300;
  return new Promise(resolve => {
    setTimeout(() => resolve(), durationMs);
  });
}


async function fetchTeamPlayerShotDetail(teamId, playerId, season) {
    console.log(`Making API Request for ${playerId} of team: ${teamId} in ${season}...`);
    const baseUrl = `https://stats.nba.com/stats/shotchartdetail`
  
    const headers =  {
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "en-US",
      Accept: "*/*",
      "User-Agent": template.user_agent,
      Referer: template.referrer,
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      Origin: "http://stats.nba.com",
    };
    parameters = {
      'ContextMeasure': 'FGA',
      'LastNGames': 0,
      'LeagueID': '00',
      'Month': 0,
      'OpponentTeamID': 0,
      'Period': 0,
      'PlayerID': playerId,
      'SeasonType': 'Regular Season',
      'TeamID': 0,
      'VsDivision': '',
      'VsConference': '',
      'SeasonSegment': '',
      'Season': season,
      'RookieYear': '',
      'PlayerPosition': '',
      'Outcome': '',
      'Location': '',
      'GameSegment': '',
      'GameId': '',
      'DateTo': '',
      'DateFrom': ''
    }
    const results = await axios.get(
        baseUrl, { 
          params: parameters,
          headers: headers 
    })
    var players = results.data.resultSets;
    var dat = [];
    var result = players.forEach(function(cellValue, cellInd){
      var headers = players[cellInd].headers
      var rowSet = players[cellInd].rowSet
      var results = rowSet.map(function(row){
        var jsonRow = {};
        row.forEach(function(cellValue, cellIndex){
          jsonRow[headers[cellIndex]] = cellValue;
        });
        return jsonRow;
      });
      dat.push(results);
    });
    var playerData = dat[0];
    return playerData;
}

async function teamShotDetailPull(team, season) {
    const teamsRoster = await readRosters(team, season)
    const playerIds = teamsRoster;
    let teamShots = [];
    // console.log(playerIds);
    console.log('Starting script for players', playerIds);
    for (const playerId of playerIds) {
        try {
          
          var playershots = await fetchTeamPlayerShotDetail(team, playerId,season);
          
          teamShots.push(...playershots)
        } catch (error) {
          console.error(error);
        }
        await delay();
    }
    await fs.promises.writeFile(
        `../public/data/teamshotchartdetail/${season}/${team}.json`,
        JSON.stringify(teamShots,null, 2)
      );
    console.log(`Done with ${team} for ${season}!`);
  }

(async function () {
    const data = await readFile(path.resolve(__dirname, "players.json"));
    getPlayers(data);
    // console.log(playersList)
    const teams = await readFile(path.resolve(__dirname, "teams.json"));
    getTeams(teams);
    // console.log(teamsList)
    // let seasons =['2020-21', '2019-20','2018-19','2017-18','2016-17', '2015-16'];
    let seasons =['2019-20','2018-19','2017-18','2016-17', '2015-16'];
    for(const season of seasons){
        for(const team of teamsList){
            try {
                await teamShotDetailPull(team,season);
            } catch (error) {
                console.error(error);
            }
            await delay();
        }
    }
    
  })();