
import React, { Component } from 'react'
// import '../css/global.css'
// import { scaleLinear } from "d3-scale"
import { max } from 'd3-array'
import { select } from 'd3-selection'
import * as d3 from "d3";
import { range } from 'd3-array';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';

// import Axis from "../components/AxisRange"
import Axis from "./AxisScatter"


class Handle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            handle: '',
            h1: 2,
            h2: 3,
            tempH1: null,
            tempH2: null,
            trueYear1: null,
            trueYear2:null
        }
        this.handleClick = this.handleClick.bind(this);
    }
    onMouseOver() {
        this.setState({
            handle: this.props.handle

        });
    }
    render() {
        const { initialValue,other, xScale, handle,margins } = this.props;
        // const circle = <circle className="handleCircle" r="10px" fill="#fa7070" />
        const circle = <circle  r="10px"  />

        return  <g className={handle} transform={`translate(${margins.left},${xScale(initialValue)})` }
                    onMouseOver={this.onMouseOver.bind(this)}   style={{fill:"#fa7070"}}   >
                    
                    {circle}

                        </g>


    }

    handleClick(prevProps) {
 
        // onChangeYear(h1,h2 );

      }



      componentDidUpdate(prevProps, prevState) {
        // let {margins,data,svgDimensions,onChangeYear,initialValue} = prevProps;
        let {handle,margins,data,svgDimensions,onChangeYear,xScale,initialValue, other,handleSide,sGroup} = this.props;

        if (handleSide === "left")
        {
            // a = other +5
            var h1 = xScale(initialValue);
            var h2 = xScale(other);   
            var tempH1 = xScale(initialValue);
            var tempH2 = xScale(other);   
            var trueH1 = initialValue 
            var trueH2 = other    
        }
        
        else if (handleSide === "right")
        {
            var h1 = xScale(other);   
            var h2 = xScale(initialValue);
            var tempH1 = xScale(other);   
            var tempH2 = xScale(initialValue);
            var trueH1 = other    
            var trueH2 = initialValue 
        }

        


        let mouseValue, trueMouseValue, self = this;
        // let handle = this.props.handle;
        let minWidth = 10//((window.screen.width/2 - margins.left - margins.right)/5);
        // let minWidth = ((window.screen.width/2 - margins.left - margins.right)/10);


        const drag = d3.drag()
            .on("drag", draged).on("end", dragend);

        d3.select(".rangeSliderGroup"+sGroup).call(drag);
        // d3.select("."+handle).call(drag);


        function draged() {
            // mouseValue = d3.mouse(this)[0];
            mouseValue = d3.mouse(this)[1];

            trueMouseValue = getTrueMouseValue(mouseValue);

            handleSide === "left" ? h1 = mouseValue : h2 = mouseValue;

            if ((h1 - h2) > minWidth && mouseValue > margins.top && mouseValue < (svgDimensions.height - margins.bottom))
            // if ((h1 - h2) > minWidth && mouseValue > 0 && mouseValue <300)

            // if ((h1 - h2) > minWidth)

             {
                d3.select("." + handle).attr("transform", "translate("+ margins.left +"," + mouseValue + ")");

                if (handleSide === "left") 
                {
                    tempH1 = mouseValue;
                    trueH1 = trueMouseValue;
                } 
                else
                {
                    tempH2 = mouseValue
                    trueH2 = trueMouseValue;
                }
            }
            else 
            {
                h1 = tempH1;
                h2 = tempH2;
                handleSide === "left" ? trueMouseValue = trueH1 : trueMouseValue = trueH2;
            }

            d3.select(".rangeBarFilled"+sGroup).remove();

            d3.select(".rangeSliderGroup" +sGroup)
                .insert("line", ".rangeSliderAxis"+sGroup)
                .attr("x1", margins.left)
                .attr("x2", margins.left)
                .attr("y1", h1)
                .attr("y2", h2)
                .attr("class", "rangeBarFilled"+sGroup)
                .style("stroke", "#fa7070")
                .style("stroke-width","3px")


        }
        function dragend() {

            if (((xScale(trueH1) < margins.left)||(xScale(trueH2) < margins.left)) || (self.state.handle !== "")) {

            }
            else {
  
                
            }


            onChangeYear(trueH1, trueH2);
            // handle = ""

        }
        function getTrueMouseValue(mouseValue) {
            // const a = xScale.invert(mouseValue) * 10
            // return Math.round(a) / 10;


            const a = xScale.invert(mouseValue) 
            // const a = xScale(mouseValue) 

            return Math.round(a) ;//+18;
        }
    }
}


const VertSlider = ({ data, onChangeYear, left, right,width,height,handle1,handle2, sGroup, handleSide, label }) => {
    const margins = { top: 20, right: 30, bottom: 20, left: 30 },
        svgDimensions = { width: width, height: height };

    const minData = d3.min(data), maxData = d3.max(data)

    // const xScale = d3.scaleLinear()
    //     .domain([0, maxData])
    //     .range([margins.left, svgDimensions.width - margins.right])
    //     .clamp(true);

    const xScale = d3.scaleLinear()
        .domain([minData, maxData])
        .range([margins.left, svgDimensions.width - margins.right])
        .clamp(true);

    const yScale = d3
        .scaleLinear()
        .domain([minData, maxData])
        .range([ svgDimensions.height -margins.bottom, margins.top])
        .clamp(true)

    const i1 = left, i2 = right


    // const RangeBar = <line x1={margins.left} y1="0" x2={svgDimensions.width - margins.right} y2="0" className={"rangeBar"} />
    // const RangeBarFilled = <line x1={xScale(i1)} y1="0" x2={xScale(i2)} y2="0" className={"rangeBarFilled"+sGroup} style={{stroke: "#fa7070","stroke-width": "3px"}}/>


    const RangeBar = <line x1={margins.left} y1="0" x2={margins.left} y2={svgDimensions.height -margins.bottom } className={"rangeBar"} />
    const RangeBarFilled = <line x1={margins.left} y1={yScale(i1)} x2={margins.left} y2={yScale(i2)}className={"rangeBarFilled"+sGroup} style={{stroke: "#fa7070","stroke-width": "3px"}}/>

    // const xScale2 = d3
    //   .scaleLinear()
    //   .domain([0, maxData])
    //   .range([margins.left, svgDimensions.width - margins.right])

      const xScale2 = d3
      .scaleLinear()
      .domain([minData, maxData])
      .range([margins.left, svgDimensions.width - margins.right])



        const yScale2 = d3
        .scaleLinear()
        .domain([minData, maxData])
        .range([ svgDimensions.height -margins.bottom, margins.top])



              
return     <svg width={width} height={svgDimensions.height} >
                <g className={"rangeSliderGroup"+sGroup} transform={`translate(0,${0})`}>
                <Axis x={margins.left} y={0} scale={yScale2} label={label} type="Left" />
                {RangeBar}
                {RangeBarFilled}
                {/* <Axis margins={margins} svgDimensions={svgDimensions} xScale={xScale} data={data}/> */}
                    {/* <Axis {...yProps}/> */}
                    <Handle onChangeYear={onChangeYear} handle={handle1} handle2={handle2} 
                         handleSide={"left"} sGroup={sGroup} initialValue={i1} other={i2} data={data} xScale={yScale2} margins={margins} svgDimensions={svgDimensions} />
                    <Handle onChangeYear={onChangeYear} handle={handle2} handle2={handle1}
                         handleSide={"right"} sGroup={sGroup} initialValue={i2} other={i1}  data={data} xScale={yScale2} margins={margins} svgDimensions={svgDimensions} />
                </g>
    </svg>;
             

}

export default VertSlider;