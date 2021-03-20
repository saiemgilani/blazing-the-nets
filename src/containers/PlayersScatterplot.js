import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import Scatterplot from '../components/Scatterplot';
import { metricsById } from '../datadefs/metrics';
import { highlightPlayer } from '../state/reducer';
import {
  getHighlightPlayerId,
  getFilteredPlayers,
} from '../state/selectors';

const mapStateToProps = state => ({
  highlightPlayerId: getHighlightPlayerId(state),
  players: getFilteredPlayers(state),
});

const mapDispatchToProps = dispatch => ({
  onHighlightPlayer: d => dispatch(highlightPlayer(d && d.id)),
});

const PlayersScatterplot = ({ highlightPlayerId, onHighlightPlayer, players, yMetric }) => {
  const xMetric = metricsById.draftPick;

  return (
    <div className="PlayersScatterplot">
      <Scatterplot
        data={players}
        width={400}
        height={400}
        xDomainPadding={1}
        yDomainPadding={1}
        yKey={yMetric.id}
        xKey={xMetric.id}
        xDataDef={xMetric}
        yDataDef={yMetric}
        highlightPointId={highlightPlayerId}
        onHighlightPoint={onHighlightPlayer}
      />
    </div>
  );
};

PlayersScatterplot.propTypes = {
  highlightPlayerId: PropTypes.string,
  onHighlightPlayer: PropTypes.func,
  players: PropTypes.array,
  yMetric: PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayersScatterplot);
