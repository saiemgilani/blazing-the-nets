import {useEffect, useState} from 'react';
import axios from 'axios';

import {apiOrigin} from '../utils/config';

function usePlayersWithRostersBySeasonApi(seasonId = null) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      const pathname = 'data/';
      const result = await axios.get(endpoint+pathname+`players.json`);
      const seasons = result.data[1];
      console.log(seasons)
      console.log(result.data.reverse())
      setPlayers(result.data.reverse());
    };
    fetchData();
  }, [seasonId]);

  return [players];
}

export default usePlayersWithRostersBySeasonApi;
