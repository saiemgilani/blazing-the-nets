import {useEffect, useState} from 'react';
import axios from 'axios';

import {apiOrigin} from '../utils/config';

function usePlayersApi() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      const fullUrl = endpoint + 'data/players.json';
      
      const result = await axios.get(fullUrl,{
        responseType: 'stream'
      });
      setPlayers(result.data);
    };
    fetchData();
  }, []);

  return [players];
}

export default usePlayersApi;
