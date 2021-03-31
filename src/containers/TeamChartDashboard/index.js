import React, {useState} from 'react';
import {useRouteMatch} from 'react-router-dom';

import TeamCharts from '../TeamCharts';
import TeamImage from '../../components/TeamImage';
import TeamSelector from '../../components/TeamSelector';
import TeamSeasonSelector from '../../components/TeamSeasonSelector';
import {
  // useTeamDashByCategoryApi,
  useTeamDashBySeason,
  useTeamSeasonsApi,
  useUrlSearchParams,
} from '../../hooks';

export default function TeamChartDashboard() {
  const match = useRouteMatch('/teams/:teamId');
  
  const urlSearchParams = useUrlSearchParams();
  const slugSeasonId = urlSearchParams.get('season_id');
  
  // const slugSeasonId = match && match.params.season ? match.params.season : '2020-21';
  
  const slugTeamId = match && match.params.teamId ? match.params.teamId : '1610612751';
  const [seasons] = useTeamSeasonsApi(slugTeamId);
  console.log(seasons)
  const [seasonId, setSeasonId] = useState(slugSeasonId || '2020-21');
  const [teams] = useTeamDashBySeason(slugTeamId);
  const [teamId, setTeamId] = useState(slugTeamId);

  if (slugTeamId && slugTeamId !== teamId) {
    setTeamId(slugTeamId);
  }

  if (teams === undefined || seasons === undefined) {
    return <div>Still fetching data</div>;
  }
  if (teams.length === 0) {
    return <div>No teams found</div>;
  }

  return (
    <div>
      <TeamImage team={teamId} />
      <TeamSelector
        team={teamId}
        teams={teams}
        setTeamId={setTeamId}
      />
      <TeamSeasonSelector
        team={teamId}
        season={seasonId}
        seasons={seasons}
        setSeasonId={setSeasonId}
      />
      <TeamCharts teamId={teamId} seasonId={seasonId} />
    </div>
  );
}
