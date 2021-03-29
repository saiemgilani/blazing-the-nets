import React from 'react';
import PropTypes from 'prop-types';
import {useHistory} from 'react-router-dom';

const TeamSelector = ({team, teams, setTeamId}) => {
  const history = useHistory();
  return (
    <form>
      <label htmlFor="teamselector">
        Team{' '}
        <select
          id="teamselector"
          value={team}
          onChange={e => {
            const teamId = e.target.value;
            history.push(`/teams/${teamId}${history.location.search}`);
            setTeamId(teamId);
          }}
        >
          {teams.map(d => (
            <option key={d.teamId} value={d.teamId}>
              {d.teamName}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
};

TeamSelector.propTypes = {
  team: PropTypes.string.isRequired,
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      teamId: PropTypes.number.isRequired,
      abbreviation: PropTypes.string.isRequired,
      teamName: PropTypes.string.isRequired,
      simpleName: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired
    })
  ).isRequired,
  setTeamId: PropTypes.func.isRequired
};

export default TeamSelector;
