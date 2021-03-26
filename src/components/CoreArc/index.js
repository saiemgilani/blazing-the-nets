import {
    scaleLinear,
    scaleQuantize,
    scaleSequential,
    scaleThreshold,
  } from 'd3-scale';
  import { arc as d3arc } from 'd3-shape';
  import { cumsum } from 'd3-array';
  import { hsl } from 'd3-color';
  import { interpolateInferno, schemeRdYlBu } from 'd3-scale-chromatic';
  export let team;
  export let players;


  const angleGlobalOffset = 0.0 * Math.PI;
  export let width = 600;
  let height = 600;

  const angleMap = {
    'rookie': (1 / 6) * 2 * Math.PI,
    'never-playoffs': (2 / 6) * 2 * Math.PI,
    'played-playoffs': (3 / 6) * 2 * Math.PI,
    'won-playoff-series': (4 / 6) * 2 * Math.PI,
    'played-finals': (5 / 6) * 2 * Math.PI,
    'won-finals': (6 / 6) * 2 * Math.PI,
  };
  const labelMap = {
    'rookie': 'Rookies',
    'never-playoffs': 'Regular Season',
    'played-playoffs': 'Made Playoffs',
    'won-playoff-series': 'Won a Series',
    'played-finals': 'Made Finals',
    'won-finals': 'Champions',
  };
  

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const innerRadius = 20;
  const ringMargin = 5;
  const refRingMargin = ringMargin * 4;

  function darkerColor(color) {
    let c = hsl(color);
    c.l -= 0.05;
    c.s -= 0.05;
    return c.toString();
  }

  function lighterColor(color) {
    let c = hsl(color);
    c.l += 0.2;
    c.s += 0.2;
    return c.toString();
  }

  function glowColor(color, factor = 1) {
    let c = hsl(color);
    c.l += factor * 0.02;
    c.s += factor * 0.02;
    return c.toString();
  }
  // based on games played
  let thicknessScale = scaleLinear().domain([0, 1000]).range([2, 10]);
  const maxThickness = thicknessScale.range()[1];
  // thicknessScale = (d) => 4;
  const thicknessKey = 'career_gp';
  const colorScale = scaleThreshold()
    .domain([0.5, 0.6]) // 60%+ is roughly 85th percentil, 50% is roughly 54th percentile
    .range(['#2d3467', '#3c9245', '#f9ce1a'])
    .range(['#0d478a', '#1c9a8b', '#f9ce1a'])
    .range(['#0d478a', '#9e8667', '#f9ce1a'])
    .range(['#992B3D', '#0d478a', '#24C79E'])
    .range(['#cc002f', '#df7f45', '#eecb61'])
    .range(['#912d2c', '#d88130', '#fbe254'])
    .range(['#edf8b1', '#7fcdbb', '#2c7fb8'])
    .range(['#fff58d', '#5bb68f', '#00649f'].reverse())
  const noGpColor = '#6b7280';

  const colorScaleOuter = colorScale
    .copy()
    .range(colorScale.range().map(darkerColor));

  // .range(['#AD813F', '#d1d5db', '#f9ce1a']) // "medals"
  // .range(['#ffeda0', '#feb24c', '#f03b20'])

  var arc = d3arc();

  const colorScale2 = scaleSequential((t) => interpolateInferno(t * 0.8 + 0.2));
  window.c = colorScale;
  //.range(schemeRdYlBu[9]);
  // .range(['blue', 'gray', 'red', 'purple', 'lime']);
  const colorKey = 'career_win_pct';
  const refIndex = 4;

  // let sortedPlayers = players.slice().filter(d => d.career_gp > 0); //players.slice().reverse();
  let sortedPlayers = players

  const thickness = sortedPlayers.map((d) =>
    Math.round(thicknessScale(d[thicknessKey]))
  );
  const cumulativeThickness = cumsum(sortedPlayers, (d) =>
    Math.round(thicknessScale(d[thicknessKey]))
  );

  const refLineLength =
    cumulativeThickness[cumulativeThickness.length - 1] +
    ringMargin * (players.length - 1) +
    innerRadius +
    refRingMargin +
    10;
  height = refLineLength * 2 + margin.top + margin.bottom;
  width = height;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const refRingRadius =
    cumulativeThickness[refIndex] +
    ringMargin * refIndex +
    innerRadius +
    refRingMargin / 2 +
    ringMargin / 2;
  // thickness[refIndex] / 2;

  let gradientId = `gradient-${team}`;
  let gradientId2 = `gradient-${team}2`;
  const highlightWidth = 2;


  const innerRadii = sortedPlayers.map((d, i) => innerRadius +
                  (cumulativeThickness[i - 1] ?? 0) +
                  ringMargin * i +
                  (i > refIndex ? refRingMargin : 0))
  const outerRadii = sortedPlayers.map((d, i) => innerRadius +
                  cumulativeThickness[i] +
                  ringMargin * i +
                  
                  (i > refIndex ? refRingMargin : 0))

  const endAngles = sortedPlayers.map((player, i) => (angleMap[player.career_gp === 0 ? 'rookie' : player.playoff_status ?? 'never-playoffs']));

  
  const refPoints = Object.keys(angleMap).map((key, i) => ({
    key,
    angle: angleMap[key],
    r: refLineLength - 8,
    color: ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow', 'black'][i],
    x: Math.cos(angleMap[key] - angleGlobalOffset - Math.PI * 0.5) * (refLineLength - 8),
    y: Math.sin(angleMap[key] - angleGlobalOffset - Math.PI * 0.5) * (refLineLength - 8),
  }))
  for (let i= 0; i < refPoints.length; ++i) {
    refPoints[i].prev = refPoints[(i - 1 + refPoints.length) % refPoints.length];
    refPoints[i].next = refPoints[(i + 1) % refPoints.length];
  }
