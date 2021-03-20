import React, { Component } from 'react'
// import './App.css'
import { scaleLinear } from "d3-scale"
import { max } from 'd3-array'
import { select } from 'd3-selection'
import * as d3 from "d3";

/********************* BubbleChart start ***************************/
function Circle(data){
    let maxRadius = d3.max(data,function (d) {
        return d.count;
    });
    let minRadius = d3.min(data,function (d) {
        return d.count;
    });
    let radiusScale = d3.scaleSqrt().domain([minRadius,maxRadius]).range([5,40]);
    const tooltip = <text fill="#fff" fontSize="14" className="bubbleChartTooltip" style={{'visibility':'hidden'}}>tooltip</text>

    return data.map((circle,index)=>{
        return <circle
            key={index}
            className="bubble"
            fill={`hsla(${circle.count},100%,70%,0.15)`}
            stroke-width="1px"
            stroke={`hsla(${circle.count},100%,70%,0.8)`}
            r = {radiusScale(circle.count)}
            cx={circle.x}
            cy={circle.y}
             onMouseMove = {(e) => {
                 d3.select(".bubbleChartTooltip")
                    .style("visibility","visible")
                    .text(circle.name + " (" +circle.count+")")
                    .attr('x',(e.nativeEvent.offsetX + 10) + "px")
                    .attr('y',(e.nativeEvent.offsetY - 10) + "px")
             }}
             onMouseOut = {() => {
                 d3.select(".bubbleChartTooltip")
                     .style("visibility","hidden")
             }}
        />
    });
}

class BubbleChart extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            bubbleChartData: []
        }
    }

  simulation(bubbleChartData){
      let maxRadius = d3.max(bubbleChartData,function (d) {
          return d.count;
      });
      let minRadius = d3.min(bubbleChartData,function (d) {
          return d.count;
      });
      let radiusScale = d3.scaleSqrt().domain([minRadius,maxRadius]).range([5,40]);
      let self = this;

      self.tick = d3.forceSimulation()
          .nodes(bubbleChartData)
          .force("xTowardsTheCenter",d3.forceX(0).strength(0.01))
          .force("yTowardsTheCenter",d3.forceY(100).strength(0.01))
          .force("collide",d3.forceCollide(function(d){
              return radiusScale(d.count);
          }))
          .on("tick",ticked);

// simulation.nodes([nodes]) adds properties to data.
    function ticked(){
        self.setState({
            bubbleChartData: bubbleChartData
        })
    }
    }
//
    componentWillReceiveProps(nextProps){
        this.setState({
            bubbleChartData: nextProps.bubbleChartData
        },function () {
            this.simulation(this.state.bubbleChartData)
        })
    }
    componentWillMount(){
        this.setState({
            bubbleChartData: this.props.bubbleChartData
        },function () {
            this.simulation(this.state.bubbleChartData)
        })
    }

    render() {
      const margins = {top: 20,right: 50,bottom: 20, left: 50},
          svgDimensions = {width: window.screen.width/2, height: window.screen.height/2 };

        const tooltip = <text fill="#fff" fontSize="14" className="bubbleChartTooltip" style={{'visibility':'hidden'}}>tooltip</text>
        return (
              <svg width={svgDimensions.width} height={svgDimensions.height}>
                <g className="bubbleChartGroup" transform={`translate(${svgDimensions.width/2},${svgDimensions.height/2 - 50})`}>
                    {Circle(this.state.bubbleChartData)}
                </g>
                  {tooltip}
              </svg>
        );
    }
}
/********************* BubbleChart end ***************************/


 /********************* RangeSlider start ***************************/
class Axis extends React.Component {
  componentDidMount(){
    this.renderAxis();
  }
  renderAxis(){
    const {svgDimensions,margins} = this.props
    const xValue = (svgDimensions.width - margins.left - margins.right)/10;
    d3.select(this.axisElement)
      .call(d3.axisBottom()
        .scale(this.props.xScale)
        .ticks(6)
        .tickFormat(d3.format(""))
      )
      .selectAll("text")
      .style("font-size","10px")
      .style("fill","white")
      .attr("x",xValue)

    d3.select(this.axisElement).selectAll("line").attr("stroke","white")
    d3.select(this.axisElement).select("path").style("d","none")
  }
  render() {
    return (
      <g className="rangeSliderAxis" transform="translate(0,10)" ref={el => this.axisElement = el } />
    )
  }
}








const xScale = d3.scaleLinear()
    .domain([2012,2017])
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
    let {margins,svgDimensions,xScale,onChangeYear} = prevProps;
    let mouseValue,trueMouseValue,self=this;
    let handle=this.state.handle;
    let minWidth = ((window.screen.width/2 - margins.left - margins.right)/5);

    const drag = d3.drag()
     .on("drag",draged).on("end",dragend);

    d3.select(".rangeSliderGroup").call(drag);

    function draged(){
      mouseValue = d3.mouse(this)[0];
      trueMouseValue = getTrueMouseValue(mouseValue);

      handle === "handle1" ? h1=mouseValue : h2=mouseValue;

      if ((h2-h1)>minWidth && mouseValue > margins.left && mouseValue < (svgDimensions.width - margins.right)){
        d3.select("."+self.state.handle).attr("transform","translate("+mouseValue+",0)");
          if (handle === "handle1") {
              tempH1 = mouseValue;
              trueYear1 = trueMouseValue;
          } else {
              tempH2 = mouseValue
              trueYear2 = trueMouseValue;
          }
      } else {
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
    function getTrueMouseValue(mouseValue){
        return Math.round(xScale.invert(mouseValue));
      }
  }
}

const RangeSlider = ({data,onChangeYear}) => {
  const margins = {top: 20, right: 50, bottom: 20, left: 50},
          svgDimensions = {width: window.screen.width/2, height: window.screen.height/6 };
  const xScale = d3.scaleLinear()
    .domain([2012,2017])
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

class Charts extends React.Component{
  constructor(){
    super();
    this.state = {
        rangeSliderData : '',
        bubbleChartData : []
    }
  }
  componentWillMount(){
    this.setState({
        rangeSliderData: {
            initialValue1 : 2013,
            initialValue2 : 2015
        },
        bubbleChartData: [
            {
            "name": "Orland",
            "count": 18
        }, {
            "name": "Keely",
            "count": 363
        }, {
            "name": "Melita",
            "count": 305
        }, {
            "name": "Morry",
            "count": 140
        }, {
            "name": "Joyous",
            "count": 481
        }, {
            "name": "Emery",
            "count": 14
        }, {
            "name": "Libbi",
            "count": 424
        }, {
            "name": "Lauralee",
            "count": 385
        }, {
            "name": "Noll",
            "count": 426
        }, {
            "name": "Paulette",
            "count": 184
        }, {
            "name": "Alfredo",
            "count": 233
        }, {
            "name": "Todd",
            "count": 66
        }, {
            "name": "Homer",
            "count": 335
        }, {
            "name": "Hana",
            "count": 343
        }, {
            "name": "Gaile",
            "count": 208
        }, {
            "name": "Rhetta",
            "count": 174
        }, {
            "name": "Claudine",
            "count": 125
        }, {
            "name": "Bonita",
            "count": 138
        }, {
            "name": "Anstice",
            "count": 367
        }, {
            "name": "Ginger",
            "count": 313
        }]
    });
  }

  handleChangeYear(year1,year2){
      this.setState({
          bubbleChartData: [{
              "name": "Orland",
              "count": 18
          }, {
              "name": "Keely",
              "count": 363
          }, {
              "name": "Melita",
              "count": 305
          }, {
              "name": "Morry",
              "count": 140
          }, {
              "name": "Joyous",
              "count": 481
          }, {
              "name": "Emery",
              "count": 14
          }, {
              "name": "Libbi",
              "count": 424
          }, {
              "name": "Lauralee",
              "count": 385
          }, {
              "name": "Noll",
              "count": 426
          }, {
              "name": "Paulette",
              "count": 184
          }, {
              "name": "Alfredo",
              "count": 233
          }, {
              "name": "Todd",
              "count": 66
          }, {
              "name": "Homer",
              "count": 335
          }, {
              "name": "Hana",
              "count": 343
          }, {
              "name": "Gaile",
              "count": 208
          }, {
              "name": "Rhetta",
              "count": 974
          }, {
              "name": "Claudine",
              "count": 125
          }, {
              "name": "Bonita",
              "count": 138
          }, {
              "name": "Anstice",
              "count": 367
          }, {
              "name": "Ginger",
              "count": 313
          }]
      })
  }

  render(){
    const width = window.screen.width/2, height = window.screen.height;

    return <div className="charts" style={{width: width , margin: '0 auto'}}>
          <div className="rangeSlider" style={{background: '#343042'}}>
            <RangeSlider onChangeYear={this.handleChangeYear.bind(this)} data={this.state.rangeSliderData}/>
          </div>
          <div className="bubbleChart" style={{background: '#403c52'}}>
            <BubbleChart bubbleChartData={this.state.bubbleChartData}/>
          </div>
      </div>;
  }
}
export default Charts;
// const mountingPoint = document.createElement('div');
// mountingPoint.className = 'react-app';
// document.body.appendChild(mountingPoint);

// ReactDOM.render(
//   <Charts />,
//   mountingPoint
// )
