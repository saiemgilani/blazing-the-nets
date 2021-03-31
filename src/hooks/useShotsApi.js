import {useEffect, useState} from 'react';
import axios from 'axios';
import { binLeftRight } from '../utils/visuals/bin';
import { binShots } from '../utils/visuals/binShots';
import { ribbonShots } from '../utils/visuals/ribbonShots';
import isLessThanDistance from '../utils/visuals/filters/isLessThanDistance';

import {apiOrigin} from '../utils/config';

function useShotsApi(playerId, seasonId, maxDistance) {
  const [data, setData] = useState(undefined);
  const [ribbonedData, setRibbonedData] = useState([]);
  const [binnedData, setBinnedData] = useState({});
  const [leftRightData, setLeftRightData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = new URL(apiOrigin);
      endpoint.pathname = `/data/shotchartdetail/${seasonId}/${playerId}.json`;
      
      const res = await axios.get(endpoint);
      console.log(res.data[0].filter(isLessThanDistance(maxDistance)))
      setData(res.data[0].filter(isLessThanDistance(maxDistance)));
      setRibbonedData(ribbonShots(res.data[0], maxDistance));
      setBinnedData(binShots(res.data[0], maxDistance));
      setLeftRightData(binLeftRight(res.data[0], maxDistance));
    };
    fetchData();
  }, [playerId, seasonId, maxDistance]);
  // console.log([{data, ribbonedData, binnedData, leftRightData}])
  return [{data, ribbonedData, binnedData, leftRightData}];
}

export default useShotsApi;
