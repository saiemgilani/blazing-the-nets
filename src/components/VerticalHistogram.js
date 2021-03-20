import React, { PureComponent, PropTypes } from 'react';
import { DataType } from 'react-taco-table';
import addComputedProps from 'react-computed-props';
import d3 from '../d3';
import DataDefPropType from '../datadefs/DataDefPropType';
import uniqueValues from '../utils/uniqueValues';

// import './VerticalHistogram.scss';

/**
 * Figure out what is needed to render the chart
 * based on the props of the component
 */
function visProps(props) {
  const {
    data,
    width,
    height,
    clampToZero,
    countNice,
    thresholdTicks,
    valueDataDef,
    valueDomainPadding,
    valueKey,
    valueNice,
  } = props;
  let {
    countDomain,
    thresholds,
    valueDomain,
  } = props;

  const color = () => 'rgb(150, 200, 250)';
  const padding = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50,
  };

  const plotAreaWidth = width - padding.left - padding.right;
  const plotAreaHeight = height - padding.top - padding.bottom;

  if (!valueDomain && data) {
    valueDomain = d3.extent(data, d => d[valueKey]);
  }

  if (clampToZero) {
    valueDomain = [0, valueDomain[1]];
  }

  const valueScale = d3.scaleLinear().range([plotAreaHeight, 0]).clamp(true);
  if (valueDomain) {
    valueScale.domain([valueDomain[0], valueDomain[1] * valueDomainPadding]);

    if (valueNice) {
      valueScale.nice();
    }
  }

  // if no thresholds are provided, compute some that make sense
  if (!thresholds) {
    // if ordinal data, make sure to get all available values as ticks
    if (valueDataDef.type === DataType.NumberOrdinal) {
      thresholds = uniqueValues(data, d => d[valueKey]);
    // otherwise use ticks based on height available or the thresholdTicks prop
    } else {
      thresholds = valueScale.ticks(thresholdTicks || (plotAreaHeight / 8));
    }
  }

  // bin the data via d3.histogram
  const hist = d3.histogram()
    .value(d => d[valueKey])
    .domain(valueScale.domain())
    .thresholds(thresholds);
  const binnedData = hist(data);

  const countScale = d3.scaleLinear().range([0, plotAreaWidth]).clamp(true);
  if (!countDomain) {
    countDomain = [0, d3.max(binnedData, d => d.length)];
    countScale.domain(countDomain);

    if (countNice) {
      countScale.nice();
    }
  }

  return {
    binnedData,
    color,
    countScale,
    padding,
    plotAreaWidth,
    plotAreaHeight,
    thresholds,
    valueScale,
  };
}

/**
 * VerticalHistogram chart
 */
class VerticalHistogram extends PureComponent {
  static propTypes = {
    barMargin: PropTypes.number,
    binnedData: PropTypes.array,
    color: PropTypes.func,
    countDataDef: DataDefPropType,
    countNice: PropTypes.bool,
    countScale: PropTypes.func,
    data: PropTypes.array,
    valueDataDef: DataDefPropType,
    valueKey: PropTypes.string,
    valueScale: PropTypes.func,
    height: PropTypes.number,
    highlightBarId: PropTypes.string,
    id: PropTypes.string,
    onHighlightBar: PropTypes.func,
    padding: PropTypes.object,
    plotAreaHeight: PropTypes.number,
    plotAreaWidth: PropTypes.number,
    recomputedProps: PropTypes.bool,
    thresholds: PropTypes.array,
    thresholdTicks: PropTypes.number,
    valueNice: PropTypes.bool,
    width: PropTypes.number,
  }

  static defaultProps = {
    barMargin: 1,
    data: [],
    valueKey: 'value',
    countKey: 'count',
    countNice: true,
    width: 200,
    height: 200,
    valueDomainPadding: 1,
    valueNice: true,
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

  onHoverPoint(d) {
    const { onHighlightBar } = this.props;

    if (onHighlightBar) {
      onHighlightBar(d);
    }
  }

  getXAxisLabel() {
    const { countDataDef } = this.props;
    const { label, unit } = countDataDef;
    return `${label}${unit ? ` (${unit})` : ''}`;
  }

  getYAxisLabel() {
    const { valueDataDef } = this.props;
    const { label, unit } = valueDataDef;
    return `${label}${unit ? ` (${unit})` : ''}`;
  }

  /**
   * Initialize the d3 chart - this is run once on mount
   */
  setup() {
    this.g = d3.select(this.root)
      .append('g'); // transformed to have margin in update()

    // add in axis groups
    this.xAxis = this.g.append('g').classed('x-axis', true);
    this.xAxisLabel = this.g.append('text')
      .attr('dy', -4)
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle');

    this.yAxis = this.g.append('g').classed('y-axis', true);
    this.yAxisLabel = this.g.append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle');

    this.bars = this.g.append('g').attr('class', 'bars');

    this.update();
  }

  /**
   * Update the d3 chart - this is the main drawing function
   */
  update() {
    const { recomputedProps } = this.props;
    // only update if we recomputed props that these rely on
    if (recomputedProps) {
      this.updateChart();
      this.updateAxes();
      this.updateBars();
    }
  }

  /**
   * Updates basic parts of the chart
   */
  updateChart() {
    const {
      padding,
    } = this.props;

    this.g.attr('transform', `translate(${padding.left} ${padding.top})`);
  }

  /**
   * Updates the bars in the chart
   */
  updateBars() {
    const {
      binnedData,
      barMargin,
      color,
      countScale,
      valueScale,
    } = this.props;
    console.log('updating with binnedData', binnedData);

    const barX = () => 0;
    const barWidth = d => (d.length > 0 ? Math.max(1, countScale(d.length)) : 0);
    const barY = d => valueScale(d.x1);
    const barHeight = d => Math.max(1, valueScale(d.x0) - valueScale(d.x1) - barMargin);

    const binding = this.bars.selectAll('.bar').data(binnedData);
    binding.exit().remove();
    const entering = binding.enter().append('rect')
      .attr('transform', d => `translate(${barX(d)} ${barY(d)})`)
      .attr('width', 0)
      .attr('height', barHeight)
      .classed('bar', true);

    binding.merge(entering)
      .transition()
      .attr('transform', d => `translate(${barX(d)} ${barY(d)})`)
      .attr('width', barWidth)
      .attr('height', barHeight)
      .attr('fill', d => color(d.id));
  }

  /**
   * Render the x and y axis components
   */
  updateAxes() {
    const { countDataDef, valueDataDef, countScale, valueScale, plotAreaHeight, plotAreaWidth, padding } = this.props;

    const xTicks = Math.round(plotAreaWidth / 50);
    const yTicks = Math.round(plotAreaHeight / 50);
    const xAxis = d3.axisBottom(countScale)
      .ticks(xTicks)
      .tickSizeOuter(0)
      .tickFormat(countDataDef.shortFormatter);

    const yAxis = d3
      .axisLeft(valueScale)
      .ticks(yTicks)
      .tickSizeOuter(0)
      .tickFormat(valueDataDef.shortFormatter);

    this.yAxis.call(yAxis);
    this.yAxisLabel
      .attr('transform', `rotate(270) translate(${-plotAreaHeight / 2} ${-padding.left + 12})`)
      .text(this.getYAxisLabel());

    this.xAxis
      .attr('transform', `translate(0 ${plotAreaHeight + 3})`)
      .call(xAxis);
    this.xAxisLabel
      .attr('transform', `translate(${plotAreaWidth / 2} ${plotAreaHeight + (padding.bottom)})`)
      .text(this.getXAxisLabel());
  }

  render() {
    const { width, height, id } = this.props;

    return (
      <div className="VerticalHistogram-container chart-container">
        <svg
          id={id}
          className="VerticalHistogram chart"
          height={height}
          ref={(node) => { this.root = node; }}
          width={width}
        />
      </div>
    );
  }
}

export default addComputedProps(visProps, {
  debug: true,
  flagRecomputed: true,
  changeExclude: ['highlightBarId'],
})(VerticalHistogram);
