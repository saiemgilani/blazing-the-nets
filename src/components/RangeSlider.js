
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
        const { initialValue,other, xScale, handle } = this.props;
        // const circle = <circle className="handleCircle" r="10px" fill="#fa7070" />
        const circle = <circle  r="10px"  />


        // if (handle === "handle1")
        // {
        //     var h1 = initialValue;
        //     var h2 = other;

        // }
        
        // else if (handle === "handle2")
        // {
        //     var h1 = other;
        //     var h2 = initialValue;
        // }

        return  <g className={handle} transform={`translate(${xScale(initialValue)},0)` }
                    onMouseOver={this.onMouseOver.bind(this)}   style={{fill:"#fa7070"}}   >
                    
                    {circle}

                        </g>

        // return <div>
        //             <div> <button onClick={this.handleClick}>
        //                     {this.state.isToggleOn ? 'ON' : 'OFF'}
        //                 </button>  
        //             </div>
                    
                    
        //             {handle}:<br></br>H1: {h1}<br></br> H2: {h2}

        //             <g className={handle} transform={`translate(${xScale(initialValue)},0)`}
        //                     onMouseOver={this.onMouseOver.bind(this)}>{circle}
        //             </g>

        //         </div>
    }

    handleClick(prevProps) {
 
        // onChangeYear(h1,h2 );

      }



      componentDidUpdate(prevProps, prevState) {
        // let {margins,data,svgDimensions,onChangeYear,initialValue} = prevProps;
        let {handle,margins,data,svgDimensions,onChangeYear,xScale,initialValue, other,handleSide,sGroup} = this.props;

        // let { margins,data, svgDimensions, xScale, onChangeYear } = prevProps;


        // const minData = d3.min(data), maxData = d3.max(data)

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
            mouseValue = d3.pointer(this)[0];
            trueMouseValue = getTrueMouseValue(mouseValue);

            handleSide === "left" ? h1 = mouseValue : h2 = mouseValue;

            if ((h2 - h1) > minWidth && mouseValue > margins.left && mouseValue < (svgDimensions.width - margins.right))
             {
                d3.select("." + handle).attr("transform", "translate(" + mouseValue + ",0)");

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
                .attr("x1", h1)
                .attr("x2", h2)
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("class", "rangeBarFilled"+sGroup)
                .style("stroke", "#fa7070")
                .style("stroke-width","3px")


        }
        function dragend() {
            // h1 = xScale(getTrueMouseValue(tempH1));
            // h2 = xScale(getTrueMouseValue(tempH2));
            // if  ((xScale(trueH1) < margins.left)&& (handleSide ==="left"))
            // {
                
            // }
            // else if ((xScale(trueH2) < margins.left)&& (handleSide ==="right"))
            // {

            // }
            if (((xScale(trueH1) < margins.left)||(xScale(trueH2) < margins.left)) || (self.state.handle !== "")) {

            }
            else {
                // d3.select("." + self.state.handle).attr("transform", "translate(" + xScale(trueMouseValue) + ",0)");

                // d3.select(".rangeBarFilled"+sGroup).remove();

                // d3.select(".rangeSliderGroup" +sGroup)
                //     .insert("line", ".rangeSliderAxis"+sGroup)
                //     .attr("x1", xScale(trueH1))
                //     .attr("x2", xScale(trueH2))
                //     .attr("y1", 0)
                //     .attr("y2", 0)
                //     .attr("class", "rangeBarFilled"+sGroup)
                //     .style("stroke", "#fa7070")
                //     .style("stroke-width","3px")

                
            }


            onChangeYear(trueH1, trueH2);
            // handle = ""

        }
        function getTrueMouseValue(mouseValue) {
            // const a = xScale.invert(mouseValue) * 10
            // return Math.round(a) / 10;


            const a = xScale.invert(mouseValue) 
            return Math.round(a) ;//+18;
        }
    }
}


const RangeSlider = ({ data, onChangeYear, left, right,width,height,handle1,handle2, sGroup, handleSide, label }) => {
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

    const i1 = left, i2 = right

    const RangeBar = <line x1={margins.left} y1="0" x2={svgDimensions.width - margins.right} y2="0" className={"rangeBar"} />
    const RangeBarFilled = <line x1={xScale(i1)} y1="0" x2={xScale(i2)} y2="0" className={"rangeBarFilled"+sGroup} style={{stroke: "#fa7070","stroke-width": "3px"}}/>

    // const xScale2 = d3
    //   .scaleLinear()
    //   .domain([0, maxData])
    //   .range([margins.left, svgDimensions.width - margins.right])

      const xScale2 = d3
      .scaleLinear()
      .domain([minData, maxData])
      .range([margins.left, svgDimensions.width - margins.right])




    // return  (
    //     <g transform={`translate(${50}, ${50})`}>
    //       {/* {data.map(([x, y]) => datapoint({ x: xScale(x), y: yScale(y) }))} */}
    //       {/* <Axis x={0} y={0} scale={yScale} type="Left" /> */}
    //        {RangeBar}{RangeBarFilled}
    //       <Axis x={0} y={200} scale={xScale2} type="Bottom" />

    //         <Handle onChangeYear={onChangeYear} handle="handle1" initialValue={i1} other={i2} data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} /> 
    //         <Handle onChangeYear={onChangeYear} handle="handle2" initialValue={i2} other={i1}  data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />

    //     </g>
    //   );


              
return     <svg width={width} height={55} >
                <g className={"rangeSliderGroup"+sGroup} transform={`translate(0,${20})`}>
                <Axis x={0} y={0} scale={xScale2} label={label} type="Bottom" />
                {RangeBar}{RangeBarFilled}
                {/* <Axis margins={margins} svgDimensions={svgDimensions} xScale={xScale} data={data}/> */}
                    {/* <Axis {...yProps}/> */}
                    <Handle onChangeYear={onChangeYear} handle={handle2} handle2={handle1} handleSide={"right"} sGroup={sGroup} initialValue={i2} other={i1}  data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
                    <Handle onChangeYear={onChangeYear} handle={handle1} handle2={handle2} handleSide={"left"} sGroup={sGroup} initialValue={i1} other={i2} data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
                </g>
    </svg>;
             



    

//     return <svg className="rangeSliderSvg" width={svgDimensions.width} height={svgDimensions.height}>
//     <g className="rangeSliderGroup" transform={`translate(0,${svgDimensions.height - margins.bottom - 40})`}>
//        {RangeBar}{RangeBarFilled}
//        {/* <Axis margins={margins} svgDimensions={svgDimensions} xScale={xScale} data={data}/> */}

//         {/* <Axis {...yProps}/> */}
//         <Handle onChangeYear={onChangeYear} handle="handle1" initialValue={i1} other={i2} data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
//         <Handle onChangeYear={onChangeYear} handle="handle2" initialValue={i2} other={i1}  data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
//     </g>
// </svg>;
            
    // return 
    //         <svg className="rangeSliderSvg" width={svgDimensions.width} height={svgDimensions.height}>
    //             <g className="rangeSliderGroup" transform={`translate(0,${svgDimensions.height - margins.bottom - 40})`}>
    //                 {/* {RangeBar}{RangeBarFilled} */}
    //                 {/* <Axis margins={margins} svgDimensions={svgDimensions} xScale={xScale} /> */}
    //                 {/* <Handle handle="handle1" initialValue={i1} other={i2}  />
    //                 <Handle handle="handle2" initialValue={i2} other={i1}  /> */}

    //                 <Handle onChangeYear={onChangeYear} handle="handle1" initialValue={i1} other={i2} data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
    //                 <Handle onChangeYear={onChangeYear} handle="handle2" initialValue={i2} other={i1}  data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
    //             </g>
    //         </svg>;
}
/********************* RangeSlider end ***************************/
export default RangeSlider;