import React, { PropTypes } from 'react';
import metrics from '../datadefs/metrics';

const MetricSelector = ({ metric, onChangeMetric }) => (
  <div className="metric-selector">
    <h5>Score By</h5>
    <select value={metric.id} onChange={evt => onChangeMetric(evt.target.value)}>
      {metrics.map(m => <option value={m.id} key={m.id}>{m.label}</option>)}
    </select>
  </div>
);

MetricSelector.propTypes = {
  metric: PropTypes.object,
  onChangeMetric: PropTypes.func,
};

export default MetricSelector;
