import {useEffect, useState} from 'react';
import axios from 'axios';

import {apiOrigin} from '../utils/config';

function usePlayerDashBySeason(seasonId = null) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      const pathname = 'data/';
      const result = await axios.get(endpoint+pathname+`players.json`);
      const seasons = result.data[1];
      
      setPlayers(result.data.reverse());
    };
    fetchData();
  }, [seasonId]);

  return [players];
}

export default usePlayerDashBySeason;
