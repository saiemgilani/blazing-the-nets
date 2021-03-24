import React from 'react';
import PropTypes from 'prop-types';
import {useHistory} from 'react-router-dom';

const PlayerSelector = ({player, players, setPlayerId}) => {
  const history = useHistory();
  return (
    <form>
      <label htmlFor="playerselector">
        Player{' '}
        <select
          id="playerselector"
          value={player}
          onChange={e => {
            const playerId = e.target.value;
            const season = '2020-21'
            history.push(`/players/${playerId}/${season}`);
            setPlayerId(playerId);
          }}
        >
          {players.map(d => (
            <option key={d.playerId} value={d.playerId}>
              {d.firstName +' '+d.lastName}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
};

PlayerSelector.propTypes = {
  player: PropTypes.string.isRequired,
  players: PropTypes.arrayOf(
    PropTypes.shape({
      playerId: PropTypes.number.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      teamId: PropTypes.number.isRequired
    })
  ).isRequired,
  setPlayerId: PropTypes.func.isRequired
};

export default PlayerSelector;
