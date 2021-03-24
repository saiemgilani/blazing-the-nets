const accessor = {
  shotFrequency: d => d.SHOT_ATTEMPTED_FLAG,
  fieldGoalPercentage: d => (100 * d.SHOT_MADE_FLAG) / d.SHOT_ATTEMPTED_FLAG || 0,
};

const domain = {
  shotFrequency: d => {
    const minimumDomain = 100;
    const leftMax = Math.max(...(d?.left?.map(accessor.shotFrequency) ?? []));
    const rightMax = Math.max(...(d?.right?.map(accessor.shotFrequency) ?? []));
    const max = Math.max(leftMax, rightMax, minimumDomain);
    return [-max, max];
  },
  fieldGoalPercentage: d => [-100, 100],
};

const labeler = {
  shotFrequency: d => ({
    counts: {
      num: d.SHOT_ATTEMPTED_FLAG,
    },
  }),
  fieldGoalPercentage: d => ({
    counts: {
      num: d.SHOT_MADE_FLAG,
      denom: d.SHOT_ATTEMPTED_FLAG,
    },
    pct: ((100 * d.SHOT_MADE_FLAG) / d.SHOT_ATTEMPTED_FLAG || 0).toFixed(2),
  }),
};

export const voronoiActivatorEvents = {
  onActivated: dispatch => (point, i) => {
    dispatch({type: 'activate', value: i});
  },
  onDeactivated: dispatch => (point, i) => {
    if (point) {
      dispatch({
        type: 'deactivate',
        value: i,
      });
    }
  },
};

export default {
  shotFrequency: {
    accessor: accessor.shotFrequency,
    domain: domain.shotFrequency,
    labeler: labeler.shotFrequency,
  },
  fieldGoalPercentage: {
    accessor: accessor.fieldGoalPercentage,
    domain: domain.fieldGoalPercentage,
    labeler: labeler.fieldGoalPercentage,
  },
};
