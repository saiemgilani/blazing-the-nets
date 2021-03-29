import React, {useState} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {hexbin} from 'd3-hexbin';
import * as d3 from 'd3';
import {scaleLinear, scaleSequential, scaleSqrt} from 'd3-scale';
import {interpolateRdBu} from 'd3-scale-chromatic';

import Court from '../Court';
import ChartDiv from '../ChartDiv';
import Hexagons from '../Hexagons';
import ShotchartCursor from './ShotchartCursor';
import Tooltip from '../Tooltip';
const colorSet = [
  '#195943',
  '#708d81',
  '#b2b187',
  '#d3c38a',
  '#f4d58d',
  '#cb552a',
  '#bf0603',
  '#8d0801'
];
const Svg = styled.svg`
  display: block;
  margin: 0 auto;
  height: auto;
  width: 100%;
  overflow: visible !important;
`;

const ShotChart = props => {
  const {data, leagueShootingPct} = props;
  const [tooltip, setTooltip] = useState({
    color: 'none',
    makes: '',
    opacity: 0,
    shots: '',
    show: false,
    transform: '',
  });
  const margin = {top: 0, right: 0, bottom: 0, left: 0};
  const width = 500;
  const height = 470;
  const svgWidth = width + margin.left + margin.right;
  const svgHeight = height + margin.top + margin.bottom;
  const backgroundColor = '#FAFBFC';
  const hexbinSize = 10;
  const clipPathId = 'hexshotchart-court-clip-path';

  const xScale = scaleLinear()
    .domain([-250, 250])
    .range([0, width]);
  const yScale = scaleLinear()
    .domain([-52.5, 417.5])
    .range([height, 0]);
  const scales = {
    x: xScale,
    y: yScale,
  };

  const radius = scaleSqrt()
    .domain([0, 50])
    .range([0, 10]);
  const color = scaleSequential(interpolateRdBu).domain([-0.21, 0.21]);
  const hexbinPath = hexbin()
  .size([width,height])
  .radius(hexbinSize);

  return (
    <ChartDiv>
      <Svg
        display="block"
        height="100%"
        width="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <clipPath id={clipPathId}>
            <rect width={width} height={height} />
          </clipPath>
          <g clipPath={`url(#${clipPathId})`}>
            <rect
              width={width}
              height={height}
              fill={backgroundColor}
              stroke="none"
            />
            <Court width={width} height={height} scale={scales} />
            <Hexagons
              color={color}
              data={data}
              hexbinPath={hexbinPath}
              hexbinSize={hexbinSize}
              leagueShootingPct={leagueShootingPct}
              radius={radius}
              scale={scales}
              updateTooltip={setTooltip}
            />
            <ShotchartCursor scale={scales} />
          </g>
          {tooltip.show && <Tooltip vals={tooltip} />}
        </g>
      </Svg>
    </ChartDiv>
  );
};

ShotChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      GAME_ID: PropTypes.string.isRequired,
      GAME_EVENT_ID: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      PLAYER_ID: PropTypes.number.isRequired,
      SHOT_DISTANCE: PropTypes.number.isRequired,
      LOC_X: PropTypes.number.isRequired,
      LOC_Y: PropTypes.number.isRequired,
      SHOT_MADE_FLAG: PropTypes.number.isRequired,
    })
  ).isRequired,
  leagueShootingPct: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default ShotChart;
