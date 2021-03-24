import React, {useState} from 'react';
import {useRouteMatch} from 'react-router-dom';

import Charts from '../Charts';
import PlayerImage from '../../components/PlayerImage';
import PlayerSelector from '../../components/PlayerSelector';
import SeasonSelector from '../../components/SeasonSelector';
import {
  usePlayersWithRostersBySeasonApi,
  useSeasonsApi,
  useUrlSearchParams,
} from '../../hooks';

export default function ChartDashboard() {
  const match = useRouteMatch('/players/:playerId/:season');
  // const urlSearchParams = useUrlSearchParams();
  const slugSeasonId = match && match.params.season ? match.params.season : '2020-21';
  
  const slugPlayerId = match && match.params.playerId ? match.params.playerId : '2544';
  const [seasons] = useSeasonsApi(slugPlayerId);
  const [seasonId, setSeasonId] = useState(slugSeasonId || '2020-21');
  const [players] = usePlayersWithRostersBySeasonApi(slugPlayerId);
  const [playerId, setPlayerId] = useState(slugPlayerId);

  if (slugPlayerId && slugPlayerId !== playerId) {
    setPlayerId(slugPlayerId);
  }
  if (slugSeasonId && slugSeasonId !== seasonId) {
    setSeasonId(slugSeasonId);
  }

  if (players === undefined || seasons === undefined) {
    return <div>Still fetching data</div>;
  }
  if (players.length === 0) {
    return <div>No players found</div>;
  }

  return (
    <div>
      <PlayerImage player={playerId} />
      <PlayerSelector
        player={playerId}
        players={players}
        setPlayerId={setPlayerId}
      />
      <SeasonSelector
        player={playerId}
        season={seasonId}
        seasons={seasons}
        setSeasonId={setSeasonId}
      />
      <Charts playerId={playerId} seasonId={seasonId} />
    </div>
  );
}
