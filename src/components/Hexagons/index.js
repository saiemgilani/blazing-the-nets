import React from 'react';
import PropTypes from 'prop-types';

import Hexagon from '../Hexagon';

function Hexagons(props) {
  const {
    color,
    data,
    hexbinPath,
    hexbinSize,
    leagueShootingPct,
    radius,
    scale,
    updateTooltip,
  } = props;
  const shots = data.map(shot => [shot.LOC_X, shot.LOC_Y, shot.SHOT_MADE_FLAG]);

  return (
    <g className="hexagons">
      {hexbinPath(shots).map(bin => (
        <Hexagon
          key={bin.x.toString() + bin.y.toString()}
          color={color}
          data={bin}
          hexbinPath={hexbinPath}
          hexbinSize={hexbinSize}
          leagueShootingPct={leagueShootingPct}
          radius={radius}
          scale={scale}
          updateTooltip={updateTooltip}
        />
      ))}
    </g>
  );
}

Hexagons.propTypes = {
  color: PropTypes.func.isRequired,
  data: PropTypes.any.isRequired,
  hexbinPath: PropTypes.any.isRequired,
  hexbinSize: PropTypes.number.isRequired,
  leagueShootingPct: PropTypes.arrayOf(PropTypes.number).isRequired,
  updateTooltip: PropTypes.func.isRequired,
  radius: PropTypes.func.isRequired,
  scale: PropTypes.shape({
    LOC_X: PropTypes.func,
    LOC_Y: PropTypes.func,
  }).isRequired,
};

export default React.memo(
  Hexagons,
  (prevProps, nextProps) => prevProps.data === nextProps.data
);
