
import React, { Component } from 'react'
// import '../css/global.css'
// import { scaleLinear } from "d3-scale"
import { max } from 'd3-array'
import { select } from 'd3-selection'
import * as d3 from "d3";
import { range } from 'd3-array';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';

// import Axis from "../components/AxisRange"
import Axis from "../components/AxisScatter"






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
        // this.handleClick = this.handleClick.bind(this);
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


        return  <g className={handle} transform={`translate(${xScale(initialValue)},0)` }
                    onMouseOver={this.onMouseOver.bind(this)}   style={{fill:"#fa7070"}}   >
                    
                    {circle}

                        </g>


    }

          componentDidUpdate(prevProps, prevState) {
        // let {margins,data,svgDimensions,onChangeYear,initialValue} = prevProps;
        let {handle,margins,data,svgDimensions,onChangeYear,xScale,initialValue, other} = this.props;

        // let { margins,data, svgDimensions, xScale, onChangeYear } = prevProps;


        // const minData = d3.min(data), maxData = d3.max(data)

    

        var h1 = xScale(initialValue);
        var h2 = xScale(other);   
        var tempH1 = xScale(initialValue);
        var tempH2 = xScale(other);   
        var trueH1 = initialValue 
        var trueH2 = other  


        let mouseValue, trueMouseValue, self = this;
        // let handle = this.props.handle;
        let minWidth = 10//((window.screen.width/2 - margins.left - margins.right)/5);
        // let minWidth = ((window.screen.width/2 - margins.left - margins.right)/10);


        const drag = d3.drag()
            .on("drag", draged).on("end", dragend);

        d3.select(".rangeSliderGroup"+handle).call(drag);

        function draged() {
            mouseValue = d3.mouse(this)[0];
            trueMouseValue = getTrueMouseValue(mouseValue);

            handle === "handle2" ? h2 = mouseValue : h1 = mouseValue;

            if (mouseValue > margins.left && mouseValue < (svgDimensions.width - margins.right)) {

                d3.select("." + handle).attr("transform", "translate(" + mouseValue + ",0)");

                tempH1 = mouseValue;
                trueH1 = trueMouseValue;
            }
            else {
                h1 = tempH1;
                h2 = tempH2;
                trueMouseValue = trueH1;
            }


        }
        function dragend() {
            h1 = xScale(getTrueMouseValue(tempH1));
            // h2 = xScale(getTrueMouseValue(tempH2));
            if (handle === "") {
                
            }
            else {
                // d3.select("." + handle).attr("transform", "translate(" + xScale(trueMouseValue) + ",0)");

                // onChangeYear(trueH1);

            }
            onChangeYear(trueH1);


        }
        function getTrueMouseValue(mouseValue) {
            // const a = xScale.invert(mouseValue) * 10
            // return Math.round(a) / 10;


            const a = xScale.invert(mouseValue) 
            return Math.round(a) ;
        }
    }
}


const SingleSlider = ({ data, onChangeYear, left, right,width,height,handle,label }) => {
    const margins = { top: 0, right: 30, bottom: 0, left: 30 },
        svgDimensions = { width: width, height: width };

    const minData = d3.min(data), maxData = d3.max(data)

    const xScale = d3.scaleLinear()
        .domain([0, maxData])
        .range([margins.left, svgDimensions.width - margins.right])
        .clamp(true);

    const i1 = left, i2 = right

    const RangeBar = <line x1={margins.left} y1="0" x2={svgDimensions.width - margins.right} y2="0" className="rangeBar" />
    // const RangeBarFilled = <line x1={xScale(i1)} y1="0" x2={xScale(i2)} y2="0" className="rangeBarFilled" />
    const xScale2 = d3
      .scaleLinear()
      .domain([0, maxData])
      .range([margins.left, svgDimensions.width - margins.right])




    // return  (
    //     <g transform={`translate(${50}, ${50})`}>
    //       {/* {data.map(([x, y]) => datapoint({ x: xScale(x), y: yScale(y) }))} */}
    //       {/* <Axis x={0} y={0} scale={yScale} type="Left" /> */}
    //        {RangeBar}
    //        {/* {RangeBarFilled} */}
    //       <Axis x={0} y={200} scale={xScale2} type="Bottom" />

    //         {/* <Handle onChangeYear={onChangeYear} handle="handle1" initialValue={i1} other={i2} data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />  */}
    //         {/* <Handle onChangeYear={onChangeYear} handle="handle2" initialValue={i2} other={i1}  data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} /> */}

    //     </g>
    //   );
    // return <div>dsadasd</div>


              
return     <svg width={width} height={height} >
                <g className={"rangeSliderGroup"+handle} transform={`translate(0,${20})`}>
                <Axis x={0} y={0} scale={xScale2} label={label} type="Bottom" />
                {/* {RangeBar} */}
                {/* {RangeBarFilled} */}
                {/* <Axis margins={margins} svgDimensions={svgDimensions} xScale={xScale} data={data}/> */}
                    {/* <Axis {...yProps}/> */}
                    <Handle onChangeYear={onChangeYear} handle={handle}  initialValue={i1}  data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} />
                    {/* <Handle onChangeYear={onChangeYear} handle="handle2" initialValue={i2} other={i1}  data={data} xScale={xScale} margins={margins} svgDimensions={svgDimensions} /> */}
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
export default SingleSlider;