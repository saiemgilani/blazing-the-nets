import {useEffect, useState} from 'react';
import axios from 'axios';

import {apiOrigin} from '../utils/config';

function useSeasonsApi(playerId) {
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      const pathname = 'data/player_dashboard_year_over_year/';
      const result = await axios.get(endpoint+pathname+`${playerId}.json`);
      const seasons = result.data[1].slice(0,5);
      console.log(seasons)
      console.log(result.data.reverse())
      
      setSeasons(seasons);
    };
    fetchData();
  }, [playerId]);

  return [seasons];
}

export default useSeasonsApi;
