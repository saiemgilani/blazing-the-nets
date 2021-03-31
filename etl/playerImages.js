const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');
const request = require('request')
const template = require("nba-client-template");
const path = require("path");
const util = require("util");
const fetch = require("node-fetch");
let playersList = [];

async function delay() {
  const durationMs = Math.random() * 800 + 300;
  return new Promise(resolve => {
    setTimeout(() => resolve(), durationMs);
  });
}
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
      // console.log(player.playerId)
      playersList.push(
          {
              playerId: player.playerId,
              teamId: player.teamId,
          })
  }
};

function fetchPlayerImage(playerId, teamId, season) {
    console.log(`Making API Request for ${playerId}, ${teamId} in ${season}...`);
    const baseUrl = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/${teamId}/${season}/260x190/${playerId}.png`
  
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
    
    var players =  fs.createWriteStream(
        `../public/data/images/players/${playerId}.png`
      );
    const response = axios.get(
        baseUrl, { 
          headers: headers, 
          responseType: 'stream'
    }).then(function(response){
        response.data.pipe(players)
    }).catch((error) => {
        console.error('[HELPER] DownloadImages ' + error + ' on Image ' + baseUrl);
    });
    
  }
async function playerImagePull() {
    const playerIds = playersList;
    // console.log(playerIds);
    console.log('Starting script for players', playerIds);
    let seasons =['2020']
    for (const playerId of playerIds) {
      for(const season of seasons){
        try {
          await fetchPlayerImage(playerId.playerId, playerId.teamId, season);
        } catch (error) {
          console.error(error);
        }
        await delay();
      
      }
    }
    console.log('Done!');
  }
  

(async function () {
  const data = await readFile(path.resolve(__dirname, "players.json"));
  getPlayers(data);
  console.log(playersList)
  playerImagePull();
})();