import React, { PureComponent, PropTypes } from 'react';
import d3 from '../d3';
import DataDefPropType from '../datadefs/DataDefPropType';

import './AxisTooltip.scss';

/**
 * Axis tooltip where values are shown around the plot area, overlapping
 * the axes.
 */
class AxisTooltip extends PureComponent {
  static propTypes = {
    color: PropTypes.string,
    data: PropTypes.array,
    height: PropTypes.number,
    highlightPoint: PropTypes.any,
    padding: PropTypes.object,
    plotAreaHeight: PropTypes.number,
    plotAreaWidth: PropTypes.number,
    width: PropTypes.number,
    xDataDef: DataDefPropType,
    xKey: PropTypes.string,
    xScale: PropTypes.func,
    yDataDef: DataDefPropType,
    yKey: PropTypes.string,
    yScale: PropTypes.func,
  }

  static defaultProps = {
    color: '#aaa',
    data: [],
    yKey: 'y',
    xKey: 'x',
    width: 200,
    height: 200,
  }

  /**
   * When the react component mounts, setup the d3 vis
   */
  componentDidMount() {
    this.setup();
  }

  /**
   * When the react component updates, update the d3 vis
   */
  componentDidUpdate() {
    this.update();
  }

  /**
   * Initialize the d3 chart - this is run once on mount
   */
  setup() {
    this.g = d3.select(this.root)
      .append('g'); // transformed to have margin in update()

    // set up highlight
    this.highlight = this.g.append('g')
      .attr('class', 'highlight')
      .attr('transform', 'translate(0 -5)');

    this.highlight.append('text')
      .attr('class', 'highlight-label');
    const axisHighlight = this.highlight.append('g')
      .attr('class', 'axis-highlights')
      .attr('transform', 'translate(0 5)');

    const highlightX = axisHighlight.append('g').attr('class', 'highlight-x');
    // add in a rect to fill out the area beneath the hovered value in X axis
    highlightX.append('rect')
      .attr('x', -25)
      .attr('width', 50)
      .attr('height', 20)
      .classed('highlight-text-bg', true);
    highlightX.append('text')
      .attr('dy', 15)
      .attr('text-anchor', 'middle');
    highlightX.append('line')
      .attr('y1', 0);

    const highlightY = axisHighlight.append('g').attr('class', 'highlight-y');
    // add in a rect to fill out the area beneath the hovered value in Y axis
    highlightY.append('rect')
      .attr('x', -20)
      .attr('width', 30)
      .attr('y', -10)
      .attr('height', 20)
      .classed('highlight-text-bg', true);
    highlightY.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'end');
    highlightY.append('line')
      .attr('transform', 'translate(10 0)')
      .attr('x1', 0);

    this.update();
  }

  /**
   * Update the d3 chart - this is the main drawing function
   */
  update() {
    const { padding } = this.props;
    this.g.attr('transform', `translate(${padding.left} ${padding.top})`);

    this.updateHighlight();
  }

  updateHighlight() {
    const {
      color,
      highlightPoint,
      yKey,
      xKey,
      xDataDef,
      yDataDef,
      xScale,
      yScale,
    } = this.props;

    // if no highlight, hide the highlight markers
    if (!highlightPoint) {
      this.highlight.style('display', 'none');
      return;
    }

    // otherwise update an show them
    this.highlight.style('display', '');

    const highlightColor = color;

    // show name in the label
    this.highlight.select('text')
      .style('fill', highlightColor)
      .text(highlightPoint.name);

    const xValue = highlightPoint[xKey];
    const yValue = highlightPoint[yKey];

    // show the value in the x axis
    const xAxisY = yScale.range()[0] + 4;
    const highlightX = this.highlight.select('.highlight-x')
      .attr('transform', `translate(${xScale(xValue)} ${xAxisY})`);

    highlightX.select('text')
      .style('fill', highlightColor)
      .text(xDataDef.formatter(xValue));
    highlightX.select('line')
      .attr('y2', -(xAxisY - yScale(yValue)))
      .style('stroke', highlightColor);


    // show the value in the y axis
    const highlightY = this.highlight.select('.highlight-y')
      .attr('transform', `translate(-10 ${yScale(yValue)})`);
    highlightY.select('text')
      .style('fill', highlightColor)
      .text(yDataDef.formatter(yValue));
    highlightY.select('line')
      .attr('x2', xScale(xValue))
      .style('stroke', highlightColor);
  }

  render() {
    const { width, height } = this.props;
    return (
      <svg
        className="AxisTooltip chart"
        height={height}
        ref={(node) => { this.root = node; }}
        width={width}
      />
    );
  }
}

export default AxisTooltip;
