
// import React, { Component } from 'react'
// // import './App.css'
// import { scaleLinear } from "d3-scale"
// import { max } from 'd3-array'
// import { select } from 'd3-selection'
// import * as d3 from "d3";



// class Axis extends React.Component {
//     componentDidMount(){
//       this.renderAxis();
//     }
//     renderAxis(){
//       const {svgDimensions,margins} = this.props
//       const xValue = (svgDimensions.width - margins.left - margins.right)/10;
//       d3.select(this.axisElement)
//         .call(d3.axisBottom()
//           .scale(this.props.xScale)
//           .ticks(6)
//           .tickFormat(d3.format(""))
//         )
//         .selectAll("text")
//         .style("font-size","10px")
//         .style("fill","white")
//         .attr("x",xValue)
  
//       d3.select(this.axisElement).selectAll("line").attr("stroke","white")
//       d3.select(this.axisElement).select("path").style("d","none")
//     }
//     render() {
//       return (
//         <g className="rangeSliderAxis" transform="translate(0,10)" ref={el => this.axisElement = el } />
//       )
//     }
//   }

import React, { Component } from 'react'
import * as d3Axis from 'd3-axis'
import { select as d3Select } from 'd3-selection'

// import './Axis.css'

class Axis extends Component {
  componentDidMount() {
    this.renderAxis()
  }

  componentDidUpdate() {
    this.renderAxis()
  }

  renderAxis() {
    const axisType = `axis${this.props.orient}`





    const axis = d3Axis[axisType]()
      .scale(this.props.scale)
      .tickSize(-this.props.tickSize)
      .tickPadding([10])
      .ticks([5])

    d3Select(this.axisElement).call(axis)
  }

  render() {
    return (
      <g
        className={`Axis Axis-${this.props.orient}`}
        ref={(el) => { this.axisElement = el; }}
        transform={this.props.translate}
      />
    )
  }
}

// export default Axis;