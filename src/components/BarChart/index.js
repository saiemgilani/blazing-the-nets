import React, {createRef, useMemo, useCallback} from 'react';
import PropTypes from 'prop-types';

import {
  useHover,
  useChartScale,
  useActivatorEvents,
  useVoronoi,
} from '../../hooks';
import {XAxis, YAxis} from './Axis';
import {Rect, StaticSvg as Svg} from '../LeftRightChart/style';
import ChartDiv from '../ChartDiv';
import ChartTitle from '../ChartTitle';
import Cursor from './Cursor';
import {voronoiActivatorEvents} from './functions';
import {scaleLinear} from 'd3-scale';

const margin = {top: 20, right: 50, bottom: 50, left: 50};
const svgWidth = 450;
const svgHeight = 300;

const barWidth = 0.8;
const barPadding = 1 - barWidth;
const barRectOffset = barPadding / 2;

const voronoiDimension = 'x';
const voronoiOptions = {voronoiDimension};

const BarChart = props => {
  const {
    accessor, 
    data, 
    domain: yDomain, 
    label, 
    maxDistance,
    color: colorScale,
    leagueShootingPct,
    title} = props;
    // console.log(data)
  const [hover, dispatchHover] = useHover();
  const svgRef = createRef();

  const domain = useMemo(
    () => ({
      x: d => [0, maxDistance],
      y: yDomain,
    }),
    [yDomain, maxDistance]
  );

  const scale = useChartScale(
    data, 
    domain, 
    maxDistance, 
    margin, {
    height: svgHeight,
    width: svgWidth,
  });

  const voronoiAccessor = useMemo(
    () => ({
      x: (d, i) => i + 0.5,
      y: accessor,
    }),
    [accessor]
  );

  const {onActivated, onDeactivated} = useActivatorEvents(
    dispatchHover,
    voronoiActivatorEvents
  );
  const onReset = useCallback(() => {
    if (!hover.toggle) {
      dispatchHover({type: 'reset'});
    }
  }, [dispatchHover, hover.toggle]);

  const voronoi = useVoronoi(
    data.bins,
    scale,
    onActivated,
    onDeactivated,
    voronoiAccessor,
    voronoiOptions
  );

  const activeIndex = hover.toggle && hover.distance;
  const activePoint = hover.toggle && data?.bins?.[hover.distance];
  const targetProps = {
    activeIndex,
    activePoint,
    parentSVG: svgRef,
    height: svgHeight,
    width: svgWidth,
    voronoiPadding: 5,
  };
  const colorSet = [
    '#8d0801',
    '#bf0603',
    '#f4d58d',
    '#708d81',
    '#195943'
  ];
    const colors = scaleLinear().domain([-.99,-0.15,0.0, 0.15,0.99]).range(colorSet);
  
  const vardata = data.bins.map(function(d,i){
    d.shootingPct = d.SHOT_ATTEMPTED_FLAG> 0 ? d.SHOT_MADE_FLAG/d.SHOT_ATTEMPTED_FLAG : 0.0;
    d.shootingPctAboveAvg = d.shootingPct - leagueShootingPct[i]
    d.color = colors(d.shootingPctAboveAvg)
  
    return d
  })

 
  const formattedData = useMemo(() => data.bins.map((d, i) => ({...d, x: i})), [
    data,
  ]);

  if (!scale || !voronoi) return null;
  return (
    <ChartDiv>
      <ChartTitle>{title}</ChartTitle>
      <Svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        ref={svgRef}
        onMouseLeave={e => voronoi.onMouseLeave(e, targetProps)}
        onTouchCancel={e => voronoi.onMouseLeave(e, targetProps)}
        onMouseMove={e => voronoi.onMouseMove(e, targetProps)}
        onTouchMove={e => voronoi.onMouseMove(e, targetProps)}
        onMouseOut={onReset}
        onBlur={onReset}
      >
        <XAxis scale={scale} />
        <YAxis scale={scale} />
        {formattedData.map(
          d =>
            d.total !== 0 && (
              <Rect
                fill={d.color}
                x={scale.x(d.x + barRectOffset)}
                y={scale.y(accessor(data.totalShotsWithinMaxDistance)(d))}
                width={scale.x(1 - barPadding) - scale.x(0)}
                height={
                  scale.y(0) -
                  scale.y(accessor(data.totalShotsWithinMaxDistance)(d))
                }
                key={`${d.LOC_X}-${d.SHOT_MADE_FLAG}-${d.SHOT_ATTEMPTED_FLAG}`}
              />
            )
        )}
        <Cursor
          datum={{...data.bins[hover.distance]}}
          totalShots={data.totalShots}
          labeler={label}
          scale={scale}
        />
      </Svg>
    </ChartDiv>
  );
};

BarChart.propTypes = {
  accessor: PropTypes.func.isRequired,
  data: PropTypes.exact({
    bins: PropTypes.arrayOf(
      PropTypes.exact({
        SHOT_MADE_FLAG: PropTypes.number.isRequired,
        SHOT_ATTEMPTED_FLAG: PropTypes.number.isRequired,
        shootingPct: PropTypes.number,
        shootingPctAboveAvg: PropTypes.number,
        color: PropTypes.any
      })
    ),
    totalMakes: PropTypes.number.isRequired,
    totalShots: PropTypes.number.isRequired,
    totalShotsWithinMaxDistance: PropTypes.number.isRequired,
  }).isRequired,
  domain: PropTypes.func.isRequired,
  label: PropTypes.func.isRequired,
  leagueShootingPct: PropTypes.array.isRequired,
  maxDistance: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
};

export default BarChart;
export {default as functions} from './functions';
