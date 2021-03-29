import React from 'react';
import PropTypes from 'prop-types';
import {useHistory} from 'react-router-dom';

const SeasonSelector = ({team, season, seasons, setSeasonId}) => {
  const history = useHistory();
  return (
    <form>
      <label htmlFor="seasonselector">
        Season{' '}
        <select
          id="seasonselector"
          value={season}
          onChange={e => {
            const seasonId = e.target.value;
            history.push(`/teams/${team}?season_id=${seasonId}`);
            setSeasonId(seasonId);
          }}
        >
          {seasons.map(d => (
            <option key={d.GROUP_VALUE} value={d.GROUP_VALUE}>
              {d.GROUP_VALUE}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
};

SeasonSelector.propTypes = {
  team: PropTypes.string.isRequired,
  season: PropTypes.string.isRequired,
  seasons: PropTypes.arrayOf(
    PropTypes.shape({
      GROUP_VALUE: PropTypes.string.isRequired
    })
  ).isRequired,
  setSeasonId: PropTypes.func.isRequired,
};

export default SeasonSelector;
