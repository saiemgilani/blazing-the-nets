import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { addUrlProps } from 'react-url-query';
import * as CustomUrlTypes from '../url/customUrlTypes';
import { metricsById } from '../datadefs/metrics';

import PlayersScatterplot from './PlayersScatterplot';
import PlayersVerticalHistogram from './PlayersVerticalHistogram';
import MetricSelector from '../components/MetricSelector';

const urlPropsQueryConfig = {
  metric: { type: CustomUrlTypes.metric },
};

const mapStateToProps = state => ({
  drafts: state.drafts.payload,
  draftYears: state.draftYears.payload,
  executives: state.executives.payload,
  players: state.players.payload,
  teams: state.teams.payload,
});


class OverviewPage extends Component {
  static propTypes = {
    metric: PropTypes.object,
    onChangeMetric: PropTypes.func,
    players: PropTypes.object,
  }

  static contextTypes = {
    router: PropTypes.object,
  }

  static defaultProps = {
    metric: metricsById.bpm,
  }

  renderPlayers() {
    const { players, metric } = this.props;

    if (!players) {
      return null;
    }

    return (
      <div>
        <h3>Players</h3>
        <div className="row">
          <div className="six columns">
            <PlayersScatterplot
              yMetric={metric}
              data={players}
            />
          </div>
          <div className="six columns">
            <PlayersVerticalHistogram
              metric={metric}
              data={players}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { metric, onChangeMetric } = this.props;

    return (
      <div className="OverviewPage">
        <MetricSelector metric={metric} onChangeMetric={onChangeMetric} />
        {this.renderPlayers()}
      </div>
    );
  }
}

export default addUrlProps({ urlPropsQueryConfig })(connect(mapStateToProps)(OverviewPage));
