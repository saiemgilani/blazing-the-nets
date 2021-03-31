import {useEffect, useState} from 'react';
import axios from 'axios';
import { binLeftRight } from '../utils/visuals/bin';
import { binShots } from '../utils/visuals/binShots';
import { ribbonShots } from '../utils/visuals/ribbonShots';
import isLessThanDistance from '../utils/visuals/filters/isLessThanDistance';

import {apiOrigin} from '../utils/config';

function useTeamShotsApi(teamId, seasonId, maxDistance) {
  const [data, setData] = useState(null);
  
  const [ribbonedData, setRibbonedData] = useState([]);
  const [binnedData, setBinnedData] = useState({});
  const [leftRightData, setLeftRightData] = useState({});

  useEffect(async() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      endpoint.pathname = `/data/teamshotchartdetail/${seasonId}/${teamId}.json`;
      
      const res = await axios.get(endpoint);
      let teamRes = [];
      teamRes.push(res.data);
      // console.log(teamRes);
      
      setData(teamRes[0].filter(isLessThanDistance(maxDistance)));
      setRibbonedData(ribbonShots(teamRes[0], maxDistance));
      // console.log(setData(teamRes[0].filter(isLessThanDistance(maxDistance))));
      // console.log(setRibbonedData(ribbonShots(teamRes[0], maxDistance)));
      setBinnedData(binShots(teamRes[0], maxDistance));
      setLeftRightData(binLeftRight(teamRes[0], maxDistance));
    };
    fetchData();
  }, [teamId, seasonId, maxDistance]);
  if(data === null){
    return 'Loading...'
  }
  // console.log([{data, ribbonedData, binnedData, leftRightData}])
  return [{data, ribbonedData, binnedData, leftRightData}];
}

export default useTeamShotsApi;
