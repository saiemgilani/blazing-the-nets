import {useEffect, useState} from 'react';
import axios from 'axios';

import {apiOrigin} from '../utils/config';

function yearExists(yr,arr) {
  return arr.some(function(el) {
    return el.GROUP_VALUE === yr;
  }); 
}
function addYear(yr, arr, seasonList) {
  if (yearExists(yr, seasonList)) {
    return false; 
  }
  if (yearExists(yr, arr)) {
    seasonList.push({ GROUP_VALUE: yr });
    return false; 
  }
}

function useSeasonsApi(playerId) {
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      const pathname = 'data/player_dashboard_year_over_year/';
      const result = await axios.get(endpoint+pathname+`${playerId}.json`);
      endpoint.search = new URLSearchParams({
        player_id: playerId,
      });
      const seasons = result.data[1];
      const seasonList  = [];
      const dataSeasons = ['2020-21','2019-20','2018-19','2017-18','2016-17','2015-16'];
      dataSeasons.forEach(data => addYear(data,seasons,seasonList))
      setSeasons(seasonList);
    };
    fetchData();
  }, [playerId]);

  return [seasons];
}

export default useSeasonsApi;
