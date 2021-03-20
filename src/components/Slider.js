import React, { Component } from 'react'
// import './App.css'
import { scaleLinear } from "d3-scale"
import { max } from 'd3-array'
import { select } from 'd3-selection'
import * as d3 from "d3";

/********************* BubbleChart start ***************************/

/********************* BubbleChart end ***************************/


 /********************* RangeSlider start ***************************/
const rng = [2000,2105]

class Axis extends React.Component {
  componentDidMount(){
    this.renderAxis();
  }
  renderAxis(){
    const {svgDimensions,margins,textcolor} = this.props
    const xValue = (svgDimensions.width - margins.left - margins.right)/10;
    d3.select(this.axisElement)
      .call(d3.axisBottom()
        .scale(this.props.xScale)
        .ticks(6)
        .tickFormat(d3.format(""))
        //.styles("d","yellow")
      )
      .selectAll("text")
      .style("font-size","10px")
      .style("fill","black")
      .attr("x",xValue)

    d3.select(this.axisElement).selectAll("line").attr("stroke","black")
    d3.select(this.axisElement).select("path").style("d","none")
    // d3.select(this.axisElement).select("path").style("stroke","yellow")
    // 
  }
  render() {
    return (
    //   <g className="rangeSliderAxis" textcolor="blue" transform="translate(0,10)" ref={el => this.axisElement = el } />
        <g></g>
    )
  }
}

const xScale = d3.scaleLinear()
    .domain(rng)
    .range([50,window.screen.width/2 - 50])
    .clamp(true);


let h1 = xScale(2013),h2=xScale(2015);
let tempH1 = xScale(2013),tempH2=xScale(2015);
let trueYear1 = 2013,trueYear2=2015;

class Handle extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      handle: ''
    }
  }
  onMouseOver(){
    this.setState({
      handle: this.props.handle
    });
  }
  render() {
    const {initialValue,xScale,handle} = this.props;
    const circle = <circle r="10px" fill="#fa7070"/>

    return <g className={handle} transform={`translate(${xScale(initialValue)},0)`}
     onMouseOver={this.onMouseOver.bind(this)}>{circle}</g>
  }

  componentDidUpdate(prevProps,prevState){
    let {margins,svgDimensions,onChangeYear} = prevProps;
    // let {margins,svgDimensions,xScale,onChangeYear} = prevProps;




    let mouseValue,trueMouseValue,self=this;
    let handle=this.state.handle;
    let minWidth = 2//((window.screen.width/2 - margins.left - margins.right)/5);
    // let minWidth = ((window.screen.width/2 - margins.left - margins.right)/10);


    const drag = d3.drag()
     .on("drag",draged).on("end",dragend);

    d3.select(".rangeSliderGroup").call(drag);

    function draged(){
      mouseValue = d3.mouse(this)[0];
      trueMouseValue = getTrueMouseValue(mouseValue);

      handle === "handle1" ? h1=mouseValue : h2=mouseValue;

      if ((h2-h1)>minWidth && mouseValue > margins.left && mouseValue < (svgDimensions.width - margins.right))
      
      {
        d3.select("."+self.state.handle).attr("transform","translate("+mouseValue+",0)");
          if (handle === "handle1") {
              tempH1 = mouseValue;
              trueYear1 = trueMouseValue;
          } else {
              tempH2 = mouseValue
              trueYear2 = trueMouseValue;
          }
      } 
      else {
        h1 = tempH1;
        h2 = tempH2;
        handle === "handle1" ? trueMouseValue = trueYear1 : trueMouseValue = trueYear2;
      }
        d3.select(".rangeBarFilled").remove();
        d3.select(".rangeSliderGroup")
            .insert("line",".rangeSliderAxis")
            .attr("x1",h1)
            .attr("x2",h2)
            .attr("y1",0)
            .attr("y2",0)
            .attr("class","rangeBarFilled")

    }
    function dragend() {
        h1 = xScale(getTrueMouseValue(tempH1));
        h2 = xScale(getTrueMouseValue(tempH2));
        if (self.state.handle === "")
        {

        }
        else {
            d3.select("."+self.state.handle).attr("transform","translate("+xScale(trueMouseValue)+",0)");
            d3.select(".rangeBarFilled").remove();
            d3.select(".rangeSliderGroup")
                .insert("line",".rangeSliderAxis")
                .attr("x1",xScale(trueYear1))
                .attr("x2",xScale(trueYear2))
                .attr("y1",0)
                .attr("y2",0)
                .attr("class","rangeBarFilled");

            onChangeYear(trueYear1,trueYear2);
        }

        
    }
    function getTrueMouseValue(mouseValue){
        const a = xScale.invert(mouseValue) *10
        return Math.round(a)/10;
      }
  }
}

const RangeSlider = ({data,onChangeYear}) => {
  const margins = {top: 20, right: 50, bottom: 20, left: 50},
          svgDimensions = {width: window.screen.width/2, height: window.screen.height/6 };

  const xScale = d3.scaleLinear()
    .domain(rng)
    .range([margins.left,svgDimensions.width - margins.right])
    .clamp(true);

  const RangeBar = <line x1={margins.left} y1="0" x2={svgDimensions.width - margins.right} y2="0" className="rangeBar" />
  const RangeBarFilled = <line x1={xScale(data.initialValue1)} y1="0" x2={xScale(data.initialValue2)} y2="0" className="rangeBarFilled" />

  return <svg className="rangeSliderSvg" width={svgDimensions.width} height={svgDimensions.height}>
      <g className="rangeSliderGroup" transform={`translate(0,${svgDimensions.height - margins.bottom - 40})`}>
         {RangeBar}{RangeBarFilled}
         <Axis margins={margins} svgDimensions={svgDimensions} xScale={xScale}/>
         <Handle onChangeYear={onChangeYear} handle="handle1" initialValue={data.initialValue1} data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
         <Handle onChangeYear={onChangeYear} handle="handle2" initialValue={data.initialValue2} data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
      </g>
  </svg>;
}
/********************* RangeSlider end ***************************/
export default RangeSlider;

// export default RangeSlider