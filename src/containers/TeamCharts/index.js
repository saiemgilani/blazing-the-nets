import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import media from '../../components/style-utils';

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
    console.log({teamId, seasonId});
    const [{teamData, teamRibbonedData, teamBinnedData, teamLeftRightData}] = useTeamShotsApi(
      teamId,
      seasonId,
      maxDistance
  );
  console.log(teamData)
  if (
    
    teamData === undefined 
    
    
  ) {
    return <div>Loading Team data</div>;
  }
  if (teamData.length === 0) {
    return <div>No result found for this team</div>;
  }

  return withHoverProvider(
    <>
      <ChartsDiv>
        <HexShotchart data={teamData} leagueShootingPct={leagueShootingPct} />
        <ShootingSignature
          data={teamRibbonedData}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
        />
        <BarChart
          accessor={barChartFunctions.shotProportion.accessor}
          data={teamBinnedData}
          domain={barChartFunctions.shotProportion.domain}
          label={barChartFunctions.shotProportion.labeler}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
          title="Shot Proportion by Distance"
        />
        <BarChart
          accessor={barChartFunctions.fieldGoalPercentage.accessor}
          data={teamBinnedData}
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
          data={teamLeftRightData}
          domain={leftRightFunctions.shotFrequency.domain}
          leagueShootingPct={leagueShootingPct}
          maxDistance={maxDistance}
          title="Shooting Frequency by Side"
        />
        <LeftRightChart
          accessor={leftRightFunctions.fieldGoalPercentage.accessor}
          data={teamLeftRightData}
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
