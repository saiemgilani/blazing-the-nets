import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
// import {axis} from "d3-axis";
// import d3_axis from 'd3-axis'
import * as d3Axis from "d3-axis";
import Axis from "../components/AxisScatter";

const formatDec = d3.format(".1f")
const formatPerc = d3.format(".0%")

// const settings = {
//     width: 500,
//     height: 300,
//     padding: 30,
//     numDataPoints: 50,
//     maxRange: () => Math.random() * 1000
//   };

class Axis1 extends React.Component {
  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  renderAxis() {
    const node = React.findDOMNode(this.refs.axisContainer);
    var axis;
    if (this.props.orient) {
      axis = d3Axis[`axis${this.props.orient}`]()
        // .orient(this.props.orient)
        .ticks(5)
        .scale(this.props.scale);
    } else {
      axis = d3Axis[`axis${this.props.orient}`]()
        // .orient(this.props.orient)
        .ticks(5)
        .scale(this.props.scale);
    }

    d3.select(node).call(axis);
  }

  render() {
    return (
      <g
        className="axis"
        ref="axisContainer"
        transform={this.props.translate}
      />
    );
  }
}

class XYAxis extends React.Component {
  render() {
    // const xScale2 = d3
    // .scaleLinear()
    // .domain([0, 30])
    // .range([0, 200])

    return (
      <g className="xy-axis">
        <Axis
          x={0}
          y={this.props.height - this.props.padding}
          scale={this.props.xScale}
          label={this.props.xCol}
          type="Bottom"
        />
		<Axis
          x={this.props.padding}
          y={0}
          scale={this.props.yScale}
          label={this.props.yCol}
          type="Left"
        />

      </g>
    );
  }
}

class DataCircles extends React.Component {


  highlight = () => {
    this.setState({ r: 10 });
  };

  unhighlight = () => {
    this.setState({ r: 3 });
  };


  renderCircle(data) {
    return (
      <circle
        cx={this.props.xScale(data[0])}
        cy={this.props.yScale(data[1])}
        r={8}
		// style={{ fill: "#fa7070" }}
        style={{ fill: "steelblue" }}
		
		key={Math.random() * 1}
		onMouseMove = {(m) => 
		{
			d3.select(".bubbleChartTooltip")
			   .style("visibility","visible")
			   .text(data[2] )
			   .attr('x',(m.nativeEvent.offsetX -5) + "px")
			   .attr('y',(m.nativeEvent.offsetY - 30) + "px")

			d3.select(".bubbleChartTooltip2")
			   .style("visibility","visible")
			   .text("(" + formatDec(data[0])+", "+formatDec(data[1])+")")
			   .attr('x',(m.nativeEvent.offsetX -5) + "px")
			   .attr('y',(m.nativeEvent.offsetY - 10) + "px")
		}}

		onMouseOut = {() => 
		{
			d3.select(".bubbleChartTooltip")
				.style("visibility","hidden")
			d3.select(".bubbleChartTooltip2")
				.style("visibility","hidden")
		}}
      />
    );
  }

  render() 
  {
	out =[]
	const ydata= this.props.ydata;
	const xdata= this.props.xdata;

	if (ydata.length === xdata.length)
    {
        var i, out = [];
        for(i=0;i<xdata.length;i++)
        {
            out.push(
						[xdata[i][1], ydata[i][1], xdata[i][0]]
				);
        }
      }
      else if (ydata.length > xdata.length){
        var i, out = [];
        for(i=0;i<xdata.length;i++)
        {
            out.push(
					[0, ydata[i][1], ydata[i][0]]
				);
        }

      }
      else if (ydata.length < xdata.length){

        var i, out = [];
        for(i=0;i<xdata.length;i++)
        {
          out.push(
			  	[xdata[i][1], 0, xdata[i][0]]
			  );
        }

	  }
	  
	return  <g>
	
				{out.map(this.renderCircle.bind(this))}
		
			</g>;
  }
}

class ScatterPlot extends React.Component 
{
  getXScale() 
  {
	const xMax = d3.max(this.props.xdata, d => d[1]);
    // const xMax = d3.max(this.props.xdata);
	

    return d3
      .scaleLinear()
      .domain([0, xMax+3])
      .range([this.props.padding, this.props.width - this.props.padding * 2]);
  }

  getYScale() 
  {
	const yMax = d3.max(this.props.ydata, d => d[1]);
    // const yMax = d3.max(this.props.ydata);
	

    return d3
      .scaleLinear()
      .domain([0, yMax+3])
      .range([this.props.height - this.props.padding, this.props.padding]);
  }

  render() 
  {
    const xScale = this.getXScale();
	const yScale = this.getYScale();
	const tooltip = <text fill="#fff" fontSize="14" className="bubbleChartTooltip" style={{'visibility':'hidden'}}>tooltip</text>
	const tooltip2 = <text fill="#fff" fontSize="14" className="bubbleChartTooltip2" style={{'visibility':'hidden'}}>tooltip</text>

	

    return (
      <svg width={this.props.width} height={this.props.height}>
		<DataCircles 
			xScale={xScale}
			yScale={yScale} 
			xdata={this.props.xdata}
			ydata={this.props.ydata}
			xCol={this.props.xCol}
			yCol={this.props.yCol}



		/>
		<XYAxis
			 xScale={xScale}
			  yScale={yScale}
			   {...this.props} />
		{tooltip}
		{tooltip2}

      </svg>
    );
  }
}
export default ScatterPlot;
