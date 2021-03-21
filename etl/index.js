const fs = require('fs');
const axios = require('axios');
const template = require("nba-client-template");
const path = require("path");

const fetch = require("node-fetch");
// so I had a really stupid time trying to read files from disk using async/await
// it resulted in me doing something i know is terribly stupid in delay20
let playersList = []
function getPlayers(){
  fs.readFile(path.resolve(__dirname, "players.json"), function (err, data) {
      if (err) {
          throw err;
      }
      players = JSON.parse(data);
      for(const player of players){
        console.log(player.playerId)
        playersList.push(player.playerId)
      }
  });
};
getPlayers();

let teamsList = []
function getTeams(){
  fs.readFile(path.resolve(__dirname, "teams.json"), function (err, data) {
      if (err) {
          throw err;
      }
      teams = JSON.parse(data);
      for(const team of teams){
        console.log(team.teamId)
        teamsList.push(team.teamId)
      }
  });
};
getTeams();

async function indexing(){
  await delay20();
  const playerIds = playersList;
  console.log(playerIds.indexOf(203463));
  console.log('Starting script for players', playerIds);
}

async function delay20() {
  const durationMs = Math.random() * 800*20 + 300;
  return new Promise(resolve => {
    setTimeout(() => resolve(), durationMs);
  });
}

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
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { headers })

  await fs.promises.writeFile(
      `../public/data/player_dashboard_year_over_year/${playerId}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function playerYoyPull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/${playerOrTeam}/${season}/${measure}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function leagueTrackingPull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/${playerOrTeam}/${season}/Defense_${measure}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function leagueTrackingDefensePull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/${playerOrTeam}/${season}/Defense_${measure}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function leagueTrackingTeamDefensePull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/shotchartdetail/${season}/${playerId}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function playerShotDetailPull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Team/${season}/Team_Shots.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function leagueTrackingTeamShotsPull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Player/${season}/Player_Shots.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function leagueTrackingPlayerShotsPull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/PlayerDashPtShots/${season}/${playerId}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function trackingPlayerShotsPull() {
  await delay20();
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
  
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { 
        params: parameters,
        headers: headers 
      })
  // console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `../public/data/LeagueTracking/Player/${season}/Player_Shot_Locations_${measure}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}
async function leagueTrackingPlayerShotLocationsPull() {
  await delay20();
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

// playerYoyPull();
// playerShotDetailPull();
// leagueTrackingPull();
// leagueTrackingDefensePull();
// leagueTrackingTeamDefensePull();
// leagueTrackingTeamShotsPull();
// leagueTrackingPlayerShotsPull();
// trackingPlayerShotsPull();
leagueTrackingPlayerShotLocationsPull();