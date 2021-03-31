import {useEffect, useState} from 'react';
import axios from 'axios';


import {apiOrigin} from '../utils/config';

function useTeamDashByCategoryApi(teamId, measure) {
  const [teamData, setTeamData] = useState(undefined);
//   const [ribbonedData, setRibbonedData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      endpoint.pathname = `/data/team_dashboard_year_over_year/2020-21/${teamId}_Base.json`;

      const res = await axios.get(endpoint);
      
      setTeamData(res.data[1]);
      
    };
    fetchData();
  }, [teamId, measure]);
  console.log(teamData)
  return [teamData];
}

export default useTeamDashByCategoryApi;
