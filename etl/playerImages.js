const fs = require('fs');
const axios = require('axios');
const request = require('request')
const template = require("nba-client-template");
const path = require("path");
const util = require("util");
const fetch = require("node-fetch");
const readFile = util.promisify(fs.readFile);
let playersList = [];
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
function getPlayers(){
fs.readFile(path.resolve(__dirname, "players.json"), function (err, data) {
    if (err) {
        throw err;
    }
    players = JSON.parse(data);
    for(const player of players){
        console.log(player.playerId)
        playersList.push(
            {
                playerId: player.playerId,
                teamId: player.teamId,
            })
    }
});
};
getPlayers();
console.log(playersList)
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
        `../public/data/images/${playerId}.png`
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
    await delay20();
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
  playerImagePull();