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
function createUrlString (_url, query) {
  const urlObj = url.parse(_url);
  urlObj.query = query;
  return urlObj.format();
}

function getJson (_url, query, _options = {}) {
  const urlStr = createUrlString(_url, query);

  const options = {
    ..._options,
    headers: { ..._options.headers, ...HEADERS },
  };

  return fetch(urlStr, options)
    .then(resp => {
      if (resp.ok) return resp.json();

      return resp.text().then(function (text) {
        throw new Error(`${resp.status} ${resp.statusText} – ${text}`);
      });
    });
};

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
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36",
    Referer: "https://www.nba.com/",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
    Origin: "http://stats.nba.com",
  };
  console.log(baseUrl)
  const results = await axios.get(
      baseUrl, { headers })
  console.log(results.data.resultSets)
  await fs.promises.writeFile(
      `..public/data/player_dashboard_year_over_year/${playerId}.json`,
      JSON.stringify(results.data.resultSets,null, 2)
    );
}

async function main() {
  await delay20();
  const playerIds = playersList;
  console.log(playerIds);
  console.log('Starting script for players', playerIds);

  for (const playerId of playerIds) {
    await fetchPlayerYearOverYear(playerId);
    await delay();
  }

  console.log('Done!');
}
main();