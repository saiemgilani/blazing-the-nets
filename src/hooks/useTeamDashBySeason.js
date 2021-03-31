import {useEffect, useState} from 'react';
import axios from 'axios';

import {apiOrigin} from '../utils/config';

function useTeamDashBySeason(seasonId = null) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      const pathname = 'data/';
      const result = await axios.get(endpoint+pathname+`teams.json`);
      const seasons = result.data;
      setTeams(result.data.reverse());
    };
    fetchData();
  }, [seasonId]);
  return [teams];
}

export default useTeamDashBySeason;
