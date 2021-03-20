import React, { Component } from 'react'
// import './App.css'
import { scaleLinear } from "d3-scale"
import { max } from 'd3-array'
import { select } from 'd3-selection'
import * as d3 from "d3";

const formatDec = d3.format(".1f")

class BarChart extends Component {
   constructor(props){
      super(props)
      this.createBarChart = this.createBarChart.bind(this)
   }
   componentDidMount() {
      this.createBarChart()
   }
   componentDidUpdate() {
      this.createBarChart()
   }
   createBarChart() {
      const node = this.node
      const dataMax = max(this.props.data.map(d => d[this.props.col]))
      
      // const data = this.props.data.map(d => d[this.props.col])
      const data = this.props.data.map(d => d[this.props.col])
      // const dataMax = max(this.props.data)

      const yScale = scaleLinear()
         .domain([0, dataMax])
         .range([0, this.props.size[1]-18])

      // const yScaleText = scaleLinear()
      //    .domain([0, dataMax ])
      //    .range([0, this.props.size[1]+ 16])


   select(node)
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
   
   select(node)
      .selectAll('rect')
      .data(data)
      .exit()
      .remove()

      select(node)      
      .selectAll('text')
      // .data(this.props.data)
      // .exit()
      .remove()


   
   select(node)
      .selectAll('rect')
      .data(data)
      .style('fill', '#fe9922')
      .attr('x', (d,i) => i * 60)
      .attr('y', d => this.props.size[1] - yScale(d))
      .attr('height', d => yScale(d))
      .attr('width', 40)


      select(node)
      // .selectAll('textNum')
      .selectAll('text')


         .data(this.props.data)
         .enter()
         .append("text")
         .text((d) => formatDec(d[this.props.col]))
         .attr("x", (d, i) => i * 60)
         .attr("y", (d, i) => this.props.size[1] - yScale(d[this.props.col]) -3 )
         .style("fill","white")
         select(node)
         .selectAll('textLabels')
   
            .data(this.props.data)
            .enter()
            .append("text")
            .text((d) => d.PLAYER_NAME.split(" ")[0])
            .attr("x", (d, i) => i * 60)
            .attr("y", (d, i) => this.props.size[1] +20  )
            .style("fill","white")

   // select(node)
   //    .selectAll('text')

   //       .data(this.props.data)
   //       .enter()
   //       .append("text")
   //       // .text((d) => d.PLAYER_NAME[0]+d.PLAYER_NAME[1]+d.PLAYER_NAME[2])
   //       .text((d) => d.PLAYER_NAME.split(" ")[0])

   //       // .attr("x", (d, i) => )
   //       .attr("x", (d, i) => i * 70)

   //       // .style("text-anchor", "end")
   //       // .attr("y", (d, i) => this.props.size[1] - yScale(d.PTS) )
   //       .attr("y", (d, i) => this.props.size[1] +20  )
            //   .attr("dx", "-.8em")
   //   .attr("dy", ".15em")
         // .attr("transform",(d, i) => " rotate(-60)")

         // .attr("transform",(d, i) => "translate(0," +20  + ") rotate(-60)")









   // select(node).append("g")
   // // svg.append("g")
   // .attr("class", "axis")
   // .attr("transform", "translate(0," +  this.props.size[1] + ")")
   // // .call(d3.axisBottom().ticks(10))
   // .selectAll("text")	
   //   .style("text-anchor", "end")
   //   .attr("dx", "-.8em")
   //   .attr("dy", ".15em")
   //   .attr("transform", "rotate(-65)");	
    

   }
render() {
      return (
      <svg ref={node => this.node = node}
         width={this.props.size[0]} height={this.props.size[1]+50}>
      </svg>
      )
   }
}
export default BarChart