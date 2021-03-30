/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import {scaleLinear} from 'd3-scale';
import styled from 'styled-components';
import { LegendThreshold } from '@vx/legend';
import { scaleThreshold } from '@vx/scale';
 
import theme from '../../theme';
const threshold = scaleThreshold({
  domain: [[-.99,-0.225,-0.15,-0.075,0.0,0.075, 0.15,0.225,0.99]],
  range: [
    '#6a1511',
    '#8d0801',
    '#bf0603',
    '#cb552a',
    '#f4d58d',
    '#b2b187',
    '#708d81',
    '#195943',
    '#124030'
  
  ],
});

const TSpan = styled.tspan`
  margin-top: 5px;
  font-size: 13px;
  fill: rgb(43, 49, 55);
`;

const defaultAxisProps = {
  role: 'presentation',
  shapeRendering: 'auto',
  strokeWidth: theme.axis.style.strokeWidth,
  stroke: theme.axis.style.axis.stroke,
  vectorEffect: 'non-scaling-stroke',
};

const tickFormat = d => `${(100 * d).toFixed(0)}`;

const Legend = ({imgHeight, imgWidth, x, y}) => {
  
  const colorSet = [
    '#8d0801',
    '#bf0603',
    '#f4d58d',
    '#708d81',
    '#195943'
  ];
    const colorScale = scaleLinear().domain([-.99,-0.15,0.0, 0.15,0.99]).range(colorSet);
  const scale = scaleLinear()
    .domain([-0.30,0.30])
    .range([0, imgWidth]);
  console.log(scale)
  const ticks = scale.ticks();
  const tickLength = 15;

  return (
    <g role="presentation" transform={`translate(${x}, ${y})`}>
      <image
        xlinkHref="/data/images/rgy5.png"
        height={imgHeight+15}
        width={imgWidth}
        preserveAspectRatio="none"
      />

      <line
        {...defaultAxisProps}
        x1={scale.range()[0]}
        x2={scale.range()[1]}
        y1={imgHeight+15}
        y2={imgHeight+15}
      />
      {ticks.map(t => (
        <g role="presentation" key={t}>
          <line
            {...defaultAxisProps}
            x1={scale(t)}
            x2={scale(t)}
            y1={imgHeight}
            y2={imgHeight + tickLength}
          />
          {t % 0.15 === 0 && (
            <text x={scale(t)} y={imgHeight + tickLength + 7} dy={20}>
              <TSpan textAnchor="middle">{tickFormat(t)}</TSpan>
            </text>
          )}
        </g>
      ))}
      <LegendThreshold
        scale={threshold}
        direction="column-reverse"
        itemDirection="row-reverse"
        labelMargin="0 20px 0 0"
        shapeMargin="1px 0 0"
      />
      <text x={imgWidth / 2} y={imgHeight + tickLength + 30} dy={20}>
              <TSpan textAnchor="middle">FG% vs League Average</TSpan>
      </text>
    </g>
  );
};

Legend.propTypes = {
  imgHeight: PropTypes.number.isRequired,
  imgWidth: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
};

export default Legend;
