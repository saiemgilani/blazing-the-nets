import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import media from '../../components/style-utils';

import { binLeftRight } from '../../utils/visuals/bin';
import { binShots } from '../../utils/visuals/binShots';
import { ribbonShots } from '../../utils/visuals/ribbonShots';
import isLessThanDistance from '../../utils/visuals/filters/isLessThanDistance';
import HexShotchart from '../../components/HexShotchart';
import ShootingSignature from '../../components/ShootingSignature';
import BarChart, {
  functions as barChartFunctions,
} from '../../components/BarChart';
import LeftRightChart, {
  functions as leftRightFunctions,
} from '../../components/LeftRightChart';
import {HoverProvider, useTeamShotsApi, useLeagueShootingPctApi} from '../../hooks';

const ChartsDiv = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  ${media.tablet`flex-direction: column;`}
`;

const withHoverProvider = children => <HoverProvider>{children}</HoverProvider>;

const TeamCharts = ({teamId, seasonId}) => {
    const maxDistance = 35;
    const [leagueShootingPct] = useLeagueShootingPctApi(maxDistance, seasonId);
    // console.log("with team charts:",{teamId, seasonId});
    const [{data, ribbonedData, binnedData, leftRightData}] = useTeamShotsApi(
      teamId,
      seasonId,
      maxDistance
  );
  
  if (
    
    data === undefined 
    
    
  ) {
    return <div>Loading Team data</div>;
  }
  if (data.length === 0) {
    return <div>No result found for this team</div>;
  }

  return withHoverProvider(
    <>
      <ChartsDiv>
        <HexShotchart data={data} leagueShootingPct={leagueShootingPct} />
        <ShootingSignature
          data={ribbonedData}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
        />
        <BarChart
          accessor={barChartFunctions.shotProportion.accessor}
          data={binnedData}
          domain={barChartFunctions.shotProportion.domain}
          label={barChartFunctions.shotProportion.labeler}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
          title="Shot Proportion by Distance"
        />
        <BarChart
          accessor={barChartFunctions.fieldGoalPercentage.accessor}
          data={binnedData}
          domain={barChartFunctions.fieldGoalPercentage.domain}
          label={barChartFunctions.fieldGoalPercentage.labeler}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
          title="Field Goal Percentage by Distance"
        />
      </ChartsDiv>
      <ChartsDiv>
        <LeftRightChart
          accessor={leftRightFunctions.shotFrequency.accessor}
          data={leftRightData}
          domain={leftRightFunctions.shotFrequency.domain}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
          title="Shooting Frequency by Side"
        />
        <LeftRightChart
          accessor={leftRightFunctions.fieldGoalPercentage.accessor}
          data={leftRightData}
          domain={leftRightFunctions.fieldGoalPercentage.domain}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
          title="Field Goal Percentage by Side"
        />
      </ChartsDiv>
    </>
  );
};

TeamCharts.propTypes = {
  teamId: PropTypes.string,
  seasonId: PropTypes.string
};

export default TeamCharts;
