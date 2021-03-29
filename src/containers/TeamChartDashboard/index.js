import React, {useState} from 'react';
import {useRouteMatch} from 'react-router-dom';

import Charts from '../Charts';
import TeamImage from '../../components/TeamImage';
import TeamSelector from '../../components/TeamSelector';
import SeasonSelector from '../../components/SeasonSelector';
import {
  usePlayerDashBySeason,
  useSeasonsApi,
  useUrlSearchParams,
} from '../../hooks';

export default function ChartDashboard() {
  const match = useRouteMatch('/team/:teamId');
  const urlSearchParams = useUrlSearchParams();
  const slugSeasonId = urlSearchParams.get('season_id');
  
  // const slugSeasonId = match && match.params.season ? match.params.season : '2020-21';
  
  const slugTeamId = match && match.params.teamId ? match.params.teamId : '1610612751';
  const [seasons] = useSeasonsApi(slugTeamId);
  const [seasonId, setSeasonId] = useState(slugSeasonId || '2020-21');
  const [teams] = usePlayerDashBySeason(slugTeamId);
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
      <SeasonSelector
        team={teamId}
        season={seasonId}
        seasons={seasons}
        setSeasonId={setSeasonId}
      />
      <Charts teamId={teamId} seasonId={teamId} />
    </div>
  );
}
