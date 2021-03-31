import {useEffect, useState} from 'react';
import axios from 'axios';
import { binLeftRight } from '../utils/visuals/bin';
import { binShots } from '../utils/visuals/binShots';
import { ribbonShots } from '../utils/visuals/ribbonShots';
import isLessThanDistance from '../utils/visuals/filters/isLessThanDistance';

import {apiOrigin} from '../utils/config';

function useTeamShotsApi(teamId, seasonId, maxDistance) {
  const [teamData, setTeamData] = useState();
  const [teamRibbonedData, setTeamRibbonedData] = useState([]);
  const [teamBinnedData, setTeamBinnedData] = useState({});
  const [teamLeftRightData, setTeamLeftRightData] = useState({});

  useEffect(() => {
    const fetchTeamData = async () => {
      const endpoint = new URL(apiOrigin);
      endpoint.pathname = `/data/teamshotchartdetail/${seasonId}/${teamId}.json`;
      
      const res = await axios.get(endpoint);
      let teamRes = [];
      teamRes.push(res.data);
      console.log(teamRes);
      
      setTeamData(teamRes[0].filter(isLessThanDistance(maxDistance)));
      setTeamRibbonedData(ribbonShots(teamRes[0], maxDistance));
      setTeamBinnedData(binShots(teamRes[0], maxDistance));
      setTeamLeftRightData(binLeftRight(teamRes[0], maxDistance));
    };
    fetchTeamData();
  }, [teamId, seasonId, maxDistance]);
  console.log([{teamData, teamRibbonedData, teamBinnedData, teamLeftRightData}])
  return [{teamData, teamRibbonedData, teamBinnedData, teamLeftRightData}];
}

export default useTeamShotsApi;
