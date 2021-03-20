import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import VerticalHistogram from '../components/VerticalHistogram';
import numPlayers from '../datadefs/numPlayers';

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
  onHighlightPlayer: d => console.log('highlight', d),
  // onHighlightPlayer: d => dispatch(highlightPlayer(d && d.id)),
});

const PlayersVerticalHistogram = ({ highlightPlayerId, onHighlightPlayer, players, metric }) => {
  return (
    <div className="PlayersVerticalHistogram">
      <VerticalHistogram
        data={players}
        width={400}
        height={400}
        countDataDef={numPlayers}
        valueKey={metric.id}
        valueDataDef={metric}
        valueDomainPadding={1}
        highlightBarId={highlightPlayerId}
        onHighlightBar={onHighlightPlayer}
      />
    </div>
  );
};

PlayersVerticalHistogram.propTypes = {
  highlightPlayerId: PropTypes.string,
  onHighlightPlayer: PropTypes.func,
  players: PropTypes.array,
  metric: PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayersVerticalHistogram);
