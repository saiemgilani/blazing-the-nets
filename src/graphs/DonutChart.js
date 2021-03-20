

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
const format = d3.format(".2f")
const formatPerc = d3.format(".0%")


function translate(x, y) {
	return `translate(${format(x)}, ${format(y)})`;
	// return `translate(${x}, ${y})`;
	
	// return 
  }
  
class Slice extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isHovered: false,
			isClicked: false,
			isSelected: false,
			prevPiece:-1,
			prevLabel:"init",

			touched: false


		
		};
		this.onMouseClick = this.onMouseClick.bind(this);

		this.onMouseOver = this.onMouseOver.bind(this);
		this.onMouseOut = this.onMouseOut.bind(this);
	}

	onMouseClick() 
	
	{

		if (this.state.isClicked === true)
		{
			this.setState({
				// isHovered: !this.state.isHovered,
				isClicked: false,
				isSelected: false,
	
	
			
			});

			this.props.func(0,this.props.label, 0)
		}
		else{
			this.setState({
				// isHovered: !this.state.isHovered,
				isClicked: true,
				isSelected: true//!this.state.isSelected,
	
	
			
			});
			if (this.state.isSelected ===false)
			{
				this.props.func(this.props.piece,this.props.label, 1)
				// this.setState({
				// 	prevPiece: this.props.piece
				// });
	
			}
			

		}
		
	}

	onMouseOver() 
	{
		if(this.state.touched === false)
		{
			this.setState({
				touched: true,
				prevPiece: this.props.piece,
				prevLabel:this.props.label

			});
		}

		if (this.state.isClicked === false)
		{
			this.setState({
				isHovered: true,
				isSelected: true
			});
			this.props.func(this.props.piece,this.props.label, 1)
			// this.setState({
			// 	prevPiece: this.props.piece
			// });


		}
		
	}
	onMouseOut() {

		if (this.state.isClicked === false)
		{
			this.setState({
				isHovered: false,
				isSelected: false
			});

			if (this.state.isSelected===true)
			{

				this.props.func(0,this.props.label, 0)
				
			}


		}
	}
	componentWillUpdate()
	{
		let {value,piece, label, fill, innerRadius = 0, outerRadius, cornerRadius, padAngle, ...props} = this.props;

		if ((piece !== this.state.prevPiece) && (this.state.prevPiece !== -1 ) && (this.state.isSelected === true) )
		{
			if ((label === this.state.prevLabel) )
			{
				this.setState({
					prevPiece: piece,
					prevLabel:label
				});
				this.props.func(piece,label, 1)
			}
			else
			{
				if (this.state.touched ===true)
				{
					this.setState({
						isSelected: false,
						// isClicked: false,
						// isSelected: false,
						// isHovered: false,
						touched:false
	
					});
				}
				


			}
			
		}
	}

	render() 
	{
		let {value,piece, label, fill, innerRadius = 0, outerRadius, cornerRadius, padAngle, ...props} = this.props;
		if (this.state.isSelected) 
		{
			outerRadius *= 1.1;
		}
		let arc = d3.arc()
		.innerRadius(innerRadius)
		.outerRadius(outerRadius)
		.cornerRadius(cornerRadius)
		.padAngle(padAngle);
		var cords= arc.centroid(value)

		// if (this.state.touched === true)
		// {

		// }

		
		
		return (
		<g 
			onMouseOver={this.onMouseOver}
			onClick={this.onMouseClick}
		   	onMouseOut={this.onMouseOut}
			{...props}>
			<path d={arc(value)} fill={fill} />
			<text fill="black"
				// transform={translate(...arc.centroid(value))}
				// transform={`translate(${cords[0]-40},${cords[1]})rotate(-30)`}
				// transform={`translate(${cords[0]-10},${cords[1]-10})`}
				transform={`translate(${cords[0]-28},${cords[1]-15})rotate(-30)`}


				// transform=""

				dy=".35em"
				className="label">
			{/* {format(arc.centroid(value)[0])} */}
			{/* {translate(...arc.centroid(value))} */}

		<tspan x="0" dy="1.2em">{label.split(" ")[0]}</tspan>
		<tspan x="0" dy="1.2em">{label.split(" ")[1]}</tspan>
		<tspan x="0" dy="1.2em">{d3.format(".1f")(piece)}</tspan>

			
			</text>
		</g>
		);
	}
}
  
class Pie extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			sum: 0,
			elements: 0,
			donut: [{
						label: "null",
						value: 0,
	
					}],
			// donut: [1,2,3,4],
			totalSum: 0.001,
			changed:false


		
		};
	//   this.colorScale = d3.scale.category10();
	//   this.colorScale = d3.scale.category10();
		this.colorScale = d3.scaleOrdinal(d3.schemeAccent);


		this.renderSlice = this.renderSlice.bind(this);

	}
	selectedValue(x, type, add)
	{
	   var shottypes = this.props.data.map((st, index) => st.SHOT_TYPE)

	   // var hmm = this.state.donut.map((st, index) => ({
	   // 	label: st.SHOT_TYPE,
	   // 	value: x,

	   // }))

	//    this.state.donut.find(d => d.label === value.data.SHOT_TYPE)

		// let temp = JSON.parse(JSON.stringify(this.state.donut))
		// let temp2 = JSON.parse(JSON.stringify(temp))
		var temp = this.state.donut

		if (temp.length >= 1)
		{
			var found = 0
			
			temp.forEach(function myFunction(el, index, arr)
			{
				if (arr[index].label === type) 
				//  if (el.label === type)
				 {
					found =1 
					temp[index].value = x

				 }
			});
			if (found===0)
			{
				temp.push(
					{
						label: type,
						value: x,
	
					}
				)
			}
	 
			 var sum = temp.map(item => item.value).reduce((prev, next) => prev + next)
			//  const sum = 2

			 this.setState({
				sum: sum,
				donut: temp,
				changed: true
			})
			this.props.forSlice(type,add,"", this.props.arr)

	 
			// const arr = [type]
	 

			
		}
		else
		{
			// this.setState({
			// 	sum: 33,
			// 	// donut: this.state.donut.length
			// })
			// this.props.forSlice(type,add)
		}
	   
	   


	   

   }
   shouldComponentUpdate(nextProps, nextState)
   {
		// if (nextProps.data.length < 1)
		// {
		// 	return true
		// }
		// var tsum = nextProps.data.map(item => item.sumShotType).reduce((prev, next) => prev + next)
		
	
		// if ((this.state.totalSum !== tsum) || this.state.changed ===true )
		// {
		// 	this.setState(
		// 		{
		// 			changed: false
		// 		}
		// 	)
			
		// 	return true
		// }
		// else 
		// {
		// 	return false
		// }
		return true
   }
   


	render() {




		let {x, y,data} = this.props;
		// data = this.props.data

		let pie = d3.pie()
		.value(d => d.sumShotType)
		// .sort(null);

		if (data.length <= 0)
		{
			var totalSum=0.001 // not nan
		}
		else
		{
			// var totalSum = data.map(item => item.sumShotType).reduce((prev, next) => prev + next)
			var tsum = data.map(item => item.sumShotType).reduce((prev, next) => prev + next)

			// this.setState({
			// 			totalSum: tsum,
						
			// 		});



			if (tsum !== this.state.totalSum)
			{
				this.setState({
					totalSum: tsum,
					sum: 0,
					donut: [{
						label: "null",
						value: 0,
	
					}],
				});
				this.props.forSlice("type","add","reset",this.props.arr)
				

			}
			

		}
		// data.map(d=> d.prevData = data)

		// data.map(d=> d.prevData = prevProps.data)

		
		return (
		<g transform={translate(x, y)}>
			{pie(data).map(this.renderSlice)}
			{/* {format(this.state.totalSum)} */}
			{/* {format(32)} */}
			<g>
					
   					 <text textAnchor="middle" x="0" y="-40" fill="white" style={{"font-family": 'Roboto, sans-serif',"fontSize":24}}
						 >
							
							<tspan x="0" dy="1.2em"> {this.state.sum} </tspan>
							<tspan x="0" dy="1.2em"> {formatPerc(this.state.sum/ this.state.totalSum)} </tspan>
							{/* <tspan x="0" dy="1.2em"> {this.state.totalSum} </tspan> */}
							{/* <tspan x="0" dy="1.2em"> {this.state.donut[0].label} </tspan> */}


							{/* <tspan x="0" dy="1.2em"> {formatPerc(this.state.sum/10)} </tspan> */}

							{/* <tspan x="0" dy="1.2em"> {d3.format(".1f")(piece)} </tspan> */}
							
					</text>
				</g>
			
		</g>

		);
	}



	renderSlice(value, i) {
		let {innerRadius, outerRadius, cornerRadius, padAngle} = this.props;

		// let {value} = this.prevProps
		// if(value.data.prevData.some(d => d.SHOT_TYPE === value.data.SHOT_TYPE))
		// {
		// 	let prev =  value.data.prevData.find(d => d.SHOT_TYPE === value.data.SHOT_TYPE);
		// 	var prevPiece = prev.sumShotType

		// } else
		// {
		// 	alert("Object not found.");
		// }


		return (
			<Slice key={i}
					innerRadius={innerRadius}
					outerRadius={outerRadius}
					cornerRadius={cornerRadius}
					padAngle={padAngle}
					value={value}
					label={value.data.SHOT_TYPE}
					piece={value.data.sumShotType}
					// prevPiece={prevPiece}
					index={i}
					fill={this.colorScale(i)} 
					func={this.selectedValue.bind(this)}
					
					/>
			);
	}
}
  
class DonutChart extends React.Component {

	inDonut(x, add,reset,arr)
	{
		this.props.onSelectedShotType(x,add,reset,arr)
	}


    render() {
		//   let width = window.innerWidth;
		//   let height = window.innerHeight;
		let width = 450;
		let height = 450//window.innerHeight;
      
		let minViewportSize = Math.min(width, height);
		let radius = (minViewportSize * .9) / 2;
		let x = width / 2;
		let y = height / 2;
	
		return (
			<svg width={width} height={height}  className="hotpie">
			{/* // <svg className="sc" width="100%" height="100%"> */}
			
			{/* <div id={"shot-chart"+this.props.namee} className="sc" ></div>*/}

			<Pie x={x}
				y={y}
				innerRadius={radius * .35}
				outerRadius={radius}
				cornerRadius={7}
				padAngle={.02}
				data={this.props.data} 
				forSlice= {this.inDonut.bind(this)}
				arr={this.props.arr}
			/>
				{/* <g>
				<circle cx="50" cy="55" r="45" fill="none" stroke="#F0CE01" strokeWidth="4" />
    <text textAnchor="middle" x="250" y="55" fill="red">Circle Text</text>
				</g> */}
			</svg>
			
		);
    }
  }

export default DonutChart;