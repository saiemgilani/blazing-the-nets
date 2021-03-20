import React from 'react'
// import nba from 'nba'
import * as d3 from 'd3'
import { hexbin } from 'd3-hexbin'
// import { court, shots } from 'd3-shotchart'
import PropTypes from 'prop-types'
import court from "../shotchart/court"
import shots from "../shotchart/shots"


import sc from '../css/ShotChart.css'

window.d3_hexbin = {hexbin: hexbin} // workaround library problem

export class ShotChart extends React.Component {

	constructor(props) {
		super(props)
		
		this.state = {
			prevTotal:-1,
			charttype: ""
		}

	}
	static propTypes = {
		playerId: PropTypes.number,
		minCount: PropTypes.number,
		chartType: PropTypes.string,
		displayToolTips: PropTypes.bool,
	  }

	shouldComponentUpdate(nextProps, nextState)
	{
		if (this.state.charttype !== nextProps.chartType)
		{
			this.setState(
				{
					charttype: nextProps.chartType
				}
			)
			
			return true
		}
		else if (nextProps.data.length !==this.state.total)
		{
			return true
		}
		else
		{
			return false
		}
	}

  

  componentDidUpdate() {
		console.log("ShotChart ToolTips: ", this.props.displayToolTips)
		
			var shotlog = this.props.data
		
		// shots 
		const namee = this.props.namee
		
			// this.props.data

		const courtSelection = d3.select("#shot-chart"+namee)
		// without this line, all updates on court would be ineffect only after changing chartType
		courtSelection.html('')
		const chart_court = court().width(this.props.width)
		const chart_shots = shots()
							.shotRenderThreshold(this.props.minCount)
							.displayToolTips(this.props.displayToolTips)
							.displayType(this.props.chartType)
		// selection.call always return the selection and not the return value of function passed in
		courtSelection.call(chart_court)
		courtSelection.datum(shotlog).call(chart_shots)

		if (this.state.total !== shotlog.length)
		{
			this.setState
			({
				 total: shotlog.length,
				 charttype:this.props.chartType
			})
		}
		
	}
	render() {
		return (
		<div id={"shot-chart"+this.props.namee} className="sc" ></div>
		);
	}
}
export default ShotChart

// SHOT_ZONE	FGM	        FGA	        FG%	    PPS
// 5	RA	    45574.0	    72427.0	    0.629	1.258
// 0	ATB3	21061.0	    60285.0	    0.349	1.048
// 4	PAINT	14177.0	    35122.0	    0.404	0.807
// 3	MR	    13404.0	    33275.0	    0.403	0.807
// 2	LC3	    3519.0	    9112.0	    0.386	1.159
// 6	RC3	    3313.0	    8771.0	    0.378	1.133
// 1	BCOURT	14.0	    466.0	    0.030	0.090