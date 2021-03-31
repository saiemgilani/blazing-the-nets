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
      teamsList.push(
          {
              teamId: team.teamId,
          })
  }
};
let teamsRoster = []
function getRoster(data){
  const players = JSON.parse(data)[0];
  for(const player of players){
      teamsRoster.push(
          {
              playerId: player.PLAYER_ID,
          })
  }
};


async function delay() {
  const durationMs = Math.random() * 800 + 300;
  return new Promise(resolve => {
    setTimeout(() => resolve(), durationMs);
  });
}

async function fetchPlayerYearOverYear(playerId) {
  console.log(`Making API Request for ${playerId}...`);
  const baseUrl = 'https://stats.nba.com/stats/playerdashboardbyyearoveryear?DateFrom=&DateTo=&GameSegment=&LastNGames=0&LeagueID=00&Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&' +
  `PlayerID=${playerId}` +
  '&PlusMinus=N&Rank=N&Season=2019-20&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&Split=yoy&VsConference=&VsDivision='

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
  const results = await axios.get(
      baseUrl, { headers })
  
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
  await fs.promises.writeFile(
      `../public/data/player_dashboard_year_over_year/${playerId}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function playerYoyPull() {
  const playerIds = playersList;
  // console.log(playerIds);
  console.log('Starting script for players', playerIds);
  for (const playerId of playerIds) {
    try {
      await fetchPlayerYearOverYear(playerId);
    } catch (error) {
      console.error(error);
    }
    await delay();
  }
  console.log('Done!');
}

async function fetchTeamYearOverYear(teamId, season, measure) {
  console.log(`Making API Request for ${teamId} ${season}: ${measure}...`);
  const baseUrl = 'https://stats.nba.com/stats/teamdashboardbyyearoveryear'

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
    'DateFrom': '',
    'DateTo': '',
    'GameSegment': '',
    'LastNGames': 0,
    'LeagueId': '',
    'Location': '',
    'MeasureType': measure,
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PORound': '',
    'PaceAdjust': 'N',
    'PerMode': 'PerGame',
    'Period': 0,
    'PlusMinus': 'N',
    'Rank': 'N',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'TeamId': teamId,
    'VsConference': '',
    'VsDivision': ''
  }
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
       })
  
  var teams = results.data.resultSets;
  var dat = [];
  var result = teams.forEach(function(cellValue, cellInd){
    var headers = teams[cellInd].headers
    var rowSet = teams[cellInd].rowSet
    var results = rowSet.map(function(row){
      var jsonRow = {};
      row.forEach(function(cellValue, cellIndex){
        jsonRow[headers[cellIndex]] = cellValue;
      });
      return jsonRow;
    });
    dat.push(results);
  });
  await fs.promises.writeFile(
      `../public/data/team_dashboard_year_over_year/${season}/${teamId}_${measure}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function teamYoyPull() {
  const teamIds = teamsList;
  
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  let measures = ['Base','Advanced','Misc','Four Factors','Scoring','Opponent'];
  // console.log(teamIds);
  console.log('Starting script for team', teamIds);
  
  for(const season in seasons){
    for (const teamId of teamIds) {
      for(const measure in measures){
        try {
          await fetchTeamYearOverYear(teamId.teamId, seasons[season], measures[measure]);
        } catch (error) {
          console.error(error);
        }
        await delay();
      }
    }
  }
  console.log('Done!');
}
/*
(SpeedDistance)|(Rebounding)|(Possessions)|(CatchShoot)|(PullUpShot)|(Defense)|(Drives)|(Passing)|(ElbowTouch)|(PostTouch)|(PaintTouch)|(Efficiency)
*/
async function fetchLeagueTracking(playerOrTeam,season,measure) {
  console.log(`Making API Request for ${playerOrTeam} ${measure} in ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashptstats`

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
    'DateFrom': '',
    'DateTo': '',
    'GameScope': '',
    'LastNGames': 0,
    'Location': '',
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PerMode': 'PerGame',
    'PlayerExperience': '',
    'PlayerOrTeam': playerOrTeam,
    'PlayerPosition': '',
    'PtMeasureType': measure,
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsDivision': '',
    'VsConference': ''
  }
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  const players = results.data.resultSets;
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

  await fs.promises.writeFile(
      `../public/data/LeagueTracking/${playerOrTeam}/${season}/${measure}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function leagueTrackingPull() {
  const cats = ['Player','Team'];
  // console.log(playerIds);
  console.log('Starting script for ', cats);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  let metrics = [
    'Defense','Drives','Passing','ElbowTouch','PostTouch','PaintTouch','Efficiency',
    'SpeedDistance','Rebounding','CatchShoot','PullUpShot','Possessions'
  ]
  for (const cat of cats) {
    for(const season of seasons){
      for(const metric of metrics){
        try {
          await fetchLeagueTracking(cat,season,metric);
        } catch (error) {
          console.error(error);
        }
        await delay();
      }
    }
  }
  console.log('Done!');
}

/**
 * @param measure (Overall)|(3 Pointers)|(2 Pointers)|(Less Than 6Ft)|(Less Than 10Ft)|(Greater Than 15Ft)
**/
async function fetchLeagueTrackingDefense(playerOrTeam,season,measure) {
  console.log(`Making API Request for ${measure} in ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashptdefend`

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
    'DateFrom': '',
    'DateTo': '',
    'DefenseCategory': measure,
    'LastNGames': 0,
    'LeagueID': '00',
    'Location': '',
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PerMode': 'PerGame',
    'PlayerExperience': '',
    'PlayerPosition': '',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsDivision': '',
    'VsConference': ''
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
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/${playerOrTeam}/${season}/Defense_${measure}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function leagueTrackingDefensePull() {
  const cats = ['Player'];
  // console.log(playerIds);
  console.log('Starting script for ', cats);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  let metrics = [ 
    'Overall', '3 Pointers','2 Pointers','Less Than 6Ft', 
    'Less Than 10Ft','Greater Than 15Ft'
  ]
  for (const cat of cats) {
    for(const season of seasons){
      for(const metric of metrics){
        try {
          await fetchLeagueTrackingDefense(cat,season,metric);
        } catch (error) {
          console.error(error);
        }
        await delay();
      }
    }
  }
  console.log('Done!');
}
/**
 * @param measure (Overall)|(3 Pointers)|(2 Pointers)|(Less Than 6Ft)|(Less Than 10Ft)|(Greater Than 15Ft)
**/
async function fetchLeagueTrackingTeamDefense(playerOrTeam,season,measure) {
  console.log(`Making API Request for ${measure} in ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashptteamdefend`

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
    'DateFrom': '',
    'DateTo': '',
    'DefenseCategory': measure,
    'LastNGames': 0,
    'LeagueID': '00',
    'Location': '',
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PerMode': 'PerGame',
    'PlayerExperience': '',
    'PlayerPosition': '',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsDivision': '',
    'VsConference': ''
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
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/${playerOrTeam}/${season}/Defense_${measure}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function leagueTrackingTeamDefensePull() {
  const cats = ['Team'];
  // console.log(playerIds);
  console.log('Starting script for ', cats);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  let metrics = [ 
    'Overall', '3 Pointers','2 Pointers','Less Than 6Ft', 
    'Less Than 10Ft','Greater Than 15Ft'
  ]
  for (const cat of cats) {
    for(const season of seasons){
      for(const metric of metrics){
        try {
          await fetchLeagueTrackingTeamDefense(cat,season,metric);
        } catch (error) {
          console.error(error);
        }
        await delay();
      }
    }
  }
  console.log('Done!');
}
async function fetchPlayerShotDetail(playerId,season) {
  console.log(`Making API Request for ${playerId} in ${season}...`);
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
  await fs.promises.writeFile(
      `../public/data/shotchartdetail/${season}/${playerId}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function playerShotDetailPull() {
  const playerIds = playersList;
  // console.log(playerIds);
  console.log('Starting script for players', playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21']
  for (const playerId of playerIds) {
    for(const season of seasons){
      try {
        await fetchPlayerShotDetail(playerId,season);
      } catch (error) {
        console.error(error);
      }
      await delay();
    
    }
  }
  console.log('Done!');
}

async function fetchLeagueTrackingTeamShots(season) {
  console.log(`Making API Request for ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashteamptshot`

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
    'DateFrom': '',
    'DateTo': '',
    'GameScope': '',
    'LastNGames': 0,
    'LeagueID': '00',
    'Location': '',
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PerMode': 'PerGame',
    'PlayerExperience': '',
    'PlayerPosition': '',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsDivision': '',
    'VsConference': ''
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
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Team/${season}/Team_Shots.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function leagueTrackingTeamShotsPull() {
  // console.log(playerIds);
  
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  for(const season of seasons){
    try {
      await fetchLeagueTrackingTeamShots(season);
    } catch (error) {
      console.error(error);
    }
    await delay();
  }
    
  
  console.log('Done!');
}

async function fetchLeagueTrackingPlayerShots(season) {
  console.log(`Making API Request for ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashplayerptshot`

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
    'DateFrom': '',
    'DateTo': '',
    'GameScope': '',
    'LastNGames': 0,
    'LeagueID': '00',
    'Location': '',
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PerMode': 'PerGame',
    'PlayerExperience': '',
    'PlayerPosition': '',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsDivision': '',
    'VsConference': ''
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
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Player/${season}/Player_Shots.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function leagueTrackingPlayerShotsPull() {
  // console.log(playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  for(const season of seasons){
    try {
      await fetchLeagueTrackingPlayerShots(season);
    } catch (error) {
      console.error(error);
    }
    await delay();
  }
  console.log('Done!');
}

async function fetchTrackingPlayerShots(playerId,season) {
  console.log(`Making API Request for ${season}: ${playerId}...`);
  const baseUrl = `https://stats.nba.com/stats/playerdashptshots`

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
    'DateFrom': '',
    'DateTo': '',
    'GameSegment': '',
    'LastNGames': 0,
    'LeagueID': '00',
    'Location': '',
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PerMode': 'PerGame',
    'Period': 0,
    'PlayerID': playerId,
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'TeamID': 0,
    'VsConference': '',
    'VsDivision': ''
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
  await fs.promises.writeFile(
      `../public/data/PlayerDashPtShots/${season}/${playerId}.json`,
      JSON.stringify(dat,null, 2)
    );
}

async function trackingPlayerShotsPull() {
  const playerIds = playersList;
  // console.log(playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  for (const playerId of playerIds) {
    for(const season of seasons){
      try {
        await fetchTrackingPlayerShots(playerId, season);
      } catch (error) {
        console.error(error);
      }
      await delay();
    }
  }
  console.log('Done!');
}

async function fetchLeagueTrackingPlayerShotLocations(season, measure) {
  console.log(`Making API Request for ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashplayershotlocations`

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
    'DateFrom': '',
    'DateTo': '',
    'DistanceRange':'By Zone',
    'GameScope': '',
    'GameSegment': '',
    'LastNGames': 0,
    'Location': '',
    'Month': 0,
    'MeasureType': measure,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PaceAdjust':'N',
    'PerMode': 'PerGame',
    'Period': 0,
    'PlayerExperience': '',
    'PlayerPosition': '',
    'PlusMinus': 'Y',
    'Rank': 'N',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsConference': '',
    'VsDivision': ''
  }
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  var players = results.data.resultSets;
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Player/${season}/Player_Shot_Locations_${measure}.json`,
      JSON.stringify(players,null, 2)
    );
}

async function leagueTrackingPlayerShotLocationsPull() {
  let measures = ['Base','Opponent'];
  // console.log(playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  for(const measure of measures){
    for(const season of seasons){
      try {
        await fetchLeagueTrackingPlayerShotLocations(season,measure);
      } catch (error) {
        console.error(error);
      }
      await delay();
    }
  }

  console.log('Done!');
}

async function fetchLeagueTrackingTeamShotLocations(season, measure) {
  console.log(`Making API Request for ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashteamshotlocations`

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
    'DateFrom': '',
    'DateTo': '',
    'DistanceRange': 'By Zone',
    'GameScope': '',
    'GameSegment': '',
    'LastNGames': 0,
    'Location': '',
    'Month': 0,
    'MeasureType': measure,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PaceAdjust':'N',
    'PerMode': 'PerGame',
    'Period': 0,
    'PlayerExperience': '',
    'PlayerPosition': '',
    'PlusMinus': 'N',
    'Rank': 'N',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsConference': '',
    'VsDivision': ''
  }
  const results = await axios.get(
    baseUrl, { 
      params: parameters,
      headers: headers 
  })
  var teams = results.data.resultSets;

  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Team/${season}/Team_Shot_Locations_${measure}.json`,
      JSON.stringify(teams,null, 2)
    );
}

async function leagueTrackingTeamShotLocationsPull() {
  let measures = ['Base'];
  // console.log(playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  for(const measure of measures){
    for(const season of seasons){
      try {
        await fetchLeagueTrackingTeamShotLocations(season,measure);
      } catch (error) {
        console.error(error);
      }
      await delay();
    }
  }

  console.log('Done!');
}

async function fetchLeagueTeamStats(season, measure) {
  console.log(`Making API Request for ${season} ${measure}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashteamstats`

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
    'DateFrom': '',
    'DateTo': '',
    'GameSegment': '',
    'LastNGames': 0,
    'Location': '',
    'MeasureType': measure,
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PaceAdjust':'N',
    'PerMode': 'PerGame',
    'Period': 0,
    'PlusMinus': 'N',
    'Rank': 'N',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsConference': '',
    'VsDivision': ''
  }
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })

  var teams = results.data.resultSets;
  var dat = [];
  var result = teams.forEach(function(cellValue, cellInd){
    var headers = teams[cellInd].headers
    var rowSet = teams[cellInd].rowSet
    var results = rowSet.map(function(row){
      var jsonRow = {};
      row.forEach(function(cellValue, cellIndex){
        jsonRow[headers[cellIndex]] = cellValue;
      });
      return jsonRow;
    });
    dat.push(results);
  });
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Team/${season}/Team_Stats_${measure}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function leagueTeamStatsPull() {
  let measures = [
    'Base','Advanced','Misc', 'Four Factors',
    'Scoring', 'Usage', 'Defense', 'Opponent'
  ];
  // console.log(playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  for(const measure of measures){
    for(const season of seasons){
      try {
        await fetchLeagueTeamStats(season,measure);
      } catch (error) {
        console.error(error);
      }
      await delay();
    }
  }

  console.log('Done!');
}

async function fetchLeaguePlayerStats(season, measure) {
  console.log(`Making API Request for ${season} ${measure}...`);
  const baseUrl = `https://stats.nba.com/stats/leaguedashplayerstats`

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
    'DateFrom': '',
    'DateTo': '',
    'GameScope': '',
    'GameSegment': '',
    'LastNGames': 0,
    'Location': '',
    'MeasureType': measure,
    'Month': 0,
    'OpponentTeamID': 0,
    'Outcome': '',
    'PaceAdjust':'N',
    'PerMode': 'PerGame',
    'Period': 0,
    'PlayerExperience': '',
    'PlayerPosition': '',
    'PlusMinus': 'N',
    'Rank': 'N',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'StarterBench': '',
    'VsConference': '',
    'VsDivision': ''
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
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Player/${season}/Player_Stats_${measure}.json`,
      JSON.stringify(dat,null, 2)
    );
}

async function leaguePlayerStatsPull() {
  let measures = [
    'Base','Advanced','Misc', 
    'Scoring', 'Usage', 'Defense'
  ];
  // console.log(playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  for(const measure of measures){
    for(const season of seasons){
      try {
        await fetchLeaguePlayerStats(season,measure);
      } catch (error) {
        console.error(error);
      }
      await delay();
    }
  }

  console.log('Done!');
}

async function fetchShotChartLineupDetail(season,team) {
  console.log(`Making API Request for ${season}...`);
  const baseUrl = `https://stats.nba.com/stats/shotchartlineupdetail`

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
    'ContextFilter': '',
    'ContextMeasure': 'PTS',
    'DateFrom': '',
    'DateTo': '',
    'GameID': 0022000653,
    'GameSegment': '',
    'GROUP_ID': 0,
    'LastNGames': 0,
    'LeagueID': '00',
    'Location': '',
    'Month': 0,
    'OpponentTeamID': '',
    'Outcome': '',
    'Period': 0,
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'TeamId': team,
    'VsConference': '',
    'VsDivision': ''
  }
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })

  var teams = results.data.resultSets;
  var dat = [];
  var result = teams.forEach(function(cellValue, cellInd){
    var headers = teams[cellInd].headers
    var rowSet = teams[cellInd].rowSet
    var results = rowSet.map(function(row){
      var jsonRow = {};
      row.forEach(function(cellValue, cellIndex){
        jsonRow[headers[cellIndex]] = cellValue;
      });
      return jsonRow;
    });
    dat.push(results);
  });
  await fs.promises.writeFile(
      `../public/data/shotchartlineupdetail/${season}/${team}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function shotChartLineupDetailPull() {
  
  // console.log(playerIds);
  let seasons =['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21'];
  let teams = teamsList;
  
  for(const season of seasons){
    for(const team of teams){
      try {
        await fetchShotChartLineupDetail(season, team.teamId);
      } catch (error) {
        console.error(error);
      }
      await delay();
    }
  }
  console.log('Done!');
}

async function fetchTeamLineupsDetail(season,team, measure) {
  console.log(`Making API Request for ${season} ${team}: ${measure}...`);
  const baseUrl = `https://stats.nba.com/stats/teamdashlineups`

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
    'DateFrom': '',
    'DateTo': '',
    'GameID': '',
    'GameSegment': '',
    'GroupQuantity': 5,
    'LastNGames': 0,
    'LeagueID': '',
    'Location': '',
    'MeasureType': measure,
    'Month': 0,
    'OpponentTeamID': '',
    'Outcome': '',
    'PORound': '',
    'PaceAdjust': 'N',
    'PerMode': 'Totals',
    'Period': 0,
    'PlusMinus': 'N',
    'Rank': 'N',
    'Season': season,
    'SeasonSegment': '',
    'SeasonType': 'Regular Season',
    'ShotClockRange': '',
    'TeamId': team,
    'VsConference': '',
    'VsDivision': ''
  }
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })

  var teams = results.data.resultSets;
  var dat = [];
  var result = teams.forEach(function(cellValue, cellInd){
    var headers = teams[cellInd].headers
    var rowSet = teams[cellInd].rowSet
    var results = rowSet.map(function(row){
      var jsonRow = {};
      row.forEach(function(cellValue, cellIndex){
        jsonRow[headers[cellIndex]] = cellValue;
      });
      return jsonRow;
    });
    dat.push(results);
  });
  await fs.promises.writeFile(
      `../public/data/teamlineups/${season}/${team}_${measure}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function teamLineupsDetailPull() {
  
  // console.log(playerIds);
  let seasons =['2020-21','2019-20','2018-19','2017-18', '2016-17', '2015-16'];
  let teams = teamsList;
  let measures = ['Base','Advanced','Misc','Four Factors','Scoring','Opponent'];
  // console.log(teamIds);
  console.log('Starting script for team', teams);
  
  for(const season of seasons){
    for (const team of teams) {
      for(const measure of measures){
        try {
          await fetchTeamLineupsDetail(season, team.teamId, measure);
        } catch (error) {
          console.error(error);
        }
        await delay();
      }
    }
  };
  console.log('Done!');
}

async function fetchTeamRosters(season,team) {
  console.log(`Making API Request for ${season} ${team}...`);
  const baseUrl = `https://stats.nba.com/stats/commonteamroster`

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
    'LeagueID': '',
    'Season': season,
    'SeasonType': 'Regular Season',
    'TeamId': team
  }
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })

  var teams = results.data.resultSets;
  var dat = [];
  var result = teams.forEach(function(cellValue, cellInd){
    var headers = teams[cellInd].headers
    var rowSet = teams[cellInd].rowSet
    var results = rowSet.map(function(row){
      var jsonRow = {};
      row.forEach(function(cellValue, cellIndex){
        jsonRow[headers[cellIndex]] = cellValue;
      });
      return jsonRow;
    });
    dat.push(results);
  });
  await fs.promises.writeFile(
    `teamrosters/${season}/${team}.json`,
    JSON.stringify(dat,null, 2)
  );
  await fs.promises.writeFile(
      `../public/data/teamrosters/${season}/${team}.json`,
      JSON.stringify(dat,null, 2)
    );
}
async function teamRostersPull() {
  
  // console.log(playerIds);
  let seasons =['2020-21','2019-20','2018-19','2017-18', '2016-17', '2015-16'];
  let teams = teamsList;
  // console.log(teamIds);
  console.log('Starting script for team', teams);
  
  for(const season of seasons){
    for (const team of teams) {
      try {
        await fetchTeamRosters(season, team.teamId);
      } catch (error) {
        console.error(error);
      }
      await delay();      
    }
  };
  console.log('Done!');
}

async function rosterRead(season,teamId){
  try {
    const rosters = readFile(`../public/data/teamrosters/${season}/${teamId}.json`);
    await getRoster(rosters);
  } catch (error) {
    console.error(error);
  }
  await delay();
};

(async function () {
  const data = await readFile(path.resolve(__dirname, "players.json"));
  getPlayers(data);
  // console.log(playersList)
  const teams = await readFile(path.resolve(__dirname, "teams.json"));
  getTeams(teams);
  // console.log(teamsList)
  const rosters = await readFile('../public/data/teamrosters/2020-21/1610612761.json');
  console.log(JSON.parse(rosters)[0]);
  getRoster(rosters)
  console.log(teamsRoster);
  
  // playerYoyPull();
  // playerShotDetailPull();
  // leagueTrackingPull();
  // leagueTrackingDefensePull();
  // leagueTrackingTeamDefensePull();
  // leagueTrackingTeamShotsPull();
  // leagueTrackingPlayerShotsPull();
  // trackingPlayerShotsPull();
  // leagueTrackingPlayerShotLocationsPull();
  // leagueTrackingTeamShotLocationsPull();
  // leagueTeamStatsPull();
  // leaguePlayerStatsPull();
  // teamYoyPull();
  // shotChartLineupDetailPull();
  // teamLineupsDetailPull();
  // teamRostersPull();
})();