import React, { Component } from 'react';

import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { WidthProvider } from "react-grid-layout";

import { CONFIG } from '../config.js';
import * as d3 from "d3";
import axios from 'axios'

import { Table } from 'react-bootstrap'


const ResponsiveReactGridLayout = WidthProvider(ResponsiveGridLayout);


const formatDec = d3.format(".2f")
const formatPerc = d3.format(".0%")

class Main1 extends Component {

	constructor(props) {
		super(props)
		this.state = {
			shotlog: [],
			stats: [],

			uniqList: [],
			uniqShotTypes: [],
			selShotTypes: [],
			// selShotTypes:["Jump Shot", "Step Back Jump shot" ,"Running Jump shot","Pullup Jump shot","Driving Layup"],
			numberKeys: [],
			uniqKeys: [],
			uniqTeams: [],


			wholePts: [],
			wholeAst: [],
			test: [],
			response: [],
			bardata: [12, 25, 6, 6, 9, 10],



			// data: d3.range(100).map(_ => [Math.random(), Math.random()]),
			data: [[0.1, 0.2], [0.3, 0.2], [4, 2], [4, 1]],
			minCount: 1,
			chartType: 'scatter',//'hexbin', // 'scatter'
			// chartType: 'hexbin', // 'scatter'

			displayToolTips: true,

			isToggleOn: true,


			left: 0,
			right: 35,

			distL: 0,
			distR: 35,

			dist2L: 0,
			dist2R: 35,

			sumFGA: [],

		};
		this.handleClick = this.handleClick.bind(this);

	}


	componentDidMount() {

		// const shotlogReq = axios.get(CONFIG.SHOTS)
		// 	.then(response =>
		// 		response.data
		//     ).then(shotlog => this.setDefault(shotlog))

		const playerStatsReq = axios.get(CONFIG.STATS)
			.then(response =>
				response.data
			).then(stats => this.setDefaultStats(stats))

	}

	setDefaultStats = (stats) => {
		stats.map(i => i.key = "stats");
		stats.map((p, i) => p.selectedP1 = false);
		stats.map((p, i) => p.selectedP2 = false);
		stats.map((p, i) => p.id = p.PLAYER_ID);
		stats.map((p, i) => p.listid = i);





		const uniqNames = [...new Set(stats.map(d => d.PLAYER_NAME))]
		// this.setState({ , uniqShotTypes: uniqShotTypes })
		var uniqList = stats.map((p, index) => ({
			option: p["PLAYER_NAME"],
			id: p["PLAYER_ID"],
			listid: index,
			// selectedP1: true,
			// selectedP2: true,
			selectedP1: false,
			selectedP2: false,
			key: "stats"
		}))

		var keys = Object.keys(stats[0])
		var numberKeys = []

		// stats.forEach(function myFunction(item, index, arr) 
		for (var i = 0; i < keys.length; i++) {
			// arr[index] = item * 10;
			if ((typeof stats[0][keys[i]] === "number") && isFinite(stats[0][keys[i]])) {
				numberKeys.push(keys[i])
			}
		}
		numberKeys = numberKeys.slice(0, 4)

		var uniqKeys = numberKeys.map((k, index) => ({
			option: k,
			id: index,
			listid: index,
			// selectedP1: true,
			// selectedP2: true,
			selectedP1: false,
			selectedP2: false,
			key: "uniqKeys"
		}))

		var uniqTeams = [...new Set(stats.map(d => d.TEAM_NAME))]

		uniqTeams = uniqTeams.map((k, index) => ({
			option: k,
			id: index,
			listid: index,
			// selectedP1: true,
			// selectedP2: true,
			selectedP1: false,
			selectedP2: false,
			key: "uniqTeams"
		}))


		uniqKeys.map((p, i) => {
			if (p.option === "PTS") { p["selectedP1"] = true; }
		})

		// uniqTeams = uniqTeams.filter((item, index) => uniqIds.includes(item.id))
		// // uniqList = uniqList.filter((item,index)=> uniqList.id.indexOf(item.id)===index)                                           
		// uniqTeams = uniqTeams.filter((uniqTeams, index, self) =>
		// 	index === self.findIndex((t) => (t.id === uniqTeams.id)))

		//     uniqTeams.map((p, i) => p.listid = i);

		// uniqTeams.map((p, i) => p.selectedP1 = true);
		// uniqList.map((p, i) => p.selectedP1 = true);
		// uniqList.map((p, i) => p.selectedP2 = true);

		// stats.map((p, i) => p.selectedP1 = true);
		// stats.map((p, i) => p.selectedP2 = true);

		// .map((p, i) => p.selectedP1 = true);


		this.setState({ stats: stats, uniqList: uniqList, numberKeys: numberKeys, uniqKeys: uniqKeys, uniqTeams: uniqTeams })


	}






	toggleSelected = (id, key, uniqList, listid, selCol, singleMode) => {
		if (singleMode) {
			// deep copy
			let temp = JSON.parse(JSON.stringify(this.state[key]))
			let temp2 = JSON.parse(JSON.stringify(this.state[key]))


			temp.map(d => d[selCol] = false)
			uniqList.map(d => d[selCol] = false)


			temp.forEach(function myFunction(item, index, arr) {
				// arr[index] = item * 10;
				if (arr[index].id === id) {
					temp[index][selCol] = !temp2[index][selCol]
				}

			})
			uniqList[listid][selCol] = !uniqList[listid][selCol]

			// uniqList[listid][selCol] = true; // !uniqList[listid][selCol]
			this.setState({
				[key]: temp,
				// uniqList: uniqList
			})

		}


		else {
			// deep copy
			let temp = JSON.parse(JSON.stringify(this.state[key]))

			temp.forEach(function myFunction(item, index, arr) {
				// arr[index] = item * 10;
				if (arr[index].id === id) {
					// temp[index].selected = !temp[index].selected
					temp[index][selCol] = !temp[index][selCol]

				}

			})
			uniqList[listid][selCol] = !uniqList[listid][selCol]
			this.setState({
				[key]: temp
			})

		}

	}

	hei1(id, key, uniqList, listid, selCol) {
		var fuckyou = 1
	}

	hei(id, key, uniqList, listid, selCol) {
		// deep copy
		let temp = JSON.parse(JSON.stringify(this.state[key]))
		// let temp2 = JSON.parse(JSON.stringify(this.state[key]))


		temp.map(d => d[selCol] = false)
		uniqList.map(d => d[selCol] = false)


		temp.forEach(function myFunction(item, index, arr) {
			// arr[index] = item * 10;
			if (arr[index].id === id) {
				// temp[index].selected = !temp[index].selected
				temp[index][selCol] = !temp[index][selCol]
				// temp[index][selCol]= !temp2[key][index][selCol]
				// temp[index][selCol]= true;


			}

		})
		// uniqList[listid][selCol] = !uniqList[listid][selCol]

		uniqList[listid][selCol] = true; // !uniqList[listid][selCol]
		this.setState({
			[key]: temp
		})
	}


	handleDistChange(x, y) {
		this.setState({
			distL: x,
			distR: y

		})
	}
	handleDistChange2(x, y) {
		this.setState({
			dist2L: x,
			dist2R: y

		})
	}

	handleMinDist(x) {
		this.setState({
			left: x,

		})
	}

	handleBinChange(x) {
		this.setState({
			minCount: x
		})
	}

	handleShotTypeChange(type, add) {
		if (add) {
			this.setState({
				selShotTypes: this.state.selShotTypes.concat([type])

			})
		}
		else {
			this.setState({
				selShotTypes: this.state.selShotTypes.filter((ele, i) => ele !== type)
			})

		}




	}


	handleClick() {
		// let {margins,data,svgDimensions,onChangeYear,xScale,initialValue, other} = prevProps;
		// let {margins,data,svgDimensions,onChangeYear,xScale,initialValue, other} = this.props;
		if (this.state.isToggleOn === false) {
			this.setState({
				isToggleOn: !this.state.isToggleOn,
				chartType: 'scatter'
			})
		}
		else if (this.state.isToggleOn === true) {
			this.setState({
				isToggleOn: !this.state.isToggleOn,
				chartType: 'hexbin'

			})
		}




	}

	resetLayout() {
		this.setState({ layouts: {} });
	}

	onLayoutChange(layout, layouts) {
		// saveToLS("layouts", layouts);
		this.setState({ layouts });
	}



	render() {

		// const names = this.state.shotlog.map(post => post.firstname)
		const { fnames, stats, uniqList, sumFGA, uniqShotTypes } = this.state
		var binrange = [1, 20]

		var testt = [0, 124, 300]


		var r1h = 9
		var r2h = 10
		var fullwidth = 12
		var halfwidth = fullwidth / 2
		var qwidth = halfwidth / 2
		var colsize = 12



		return (
			<div style={{ background: '#57667B', color: "white" }}>

				<ResponsiveReactGridLayout
					className="layout"
					breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
					// cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
					cols={{ lg: colsize, md: colsize, sm: colsize, xs: colsize, xxs: colsize }}

					rowHeight={30}
					layouts={this.state.layouts}
					margin={[10, 10]}
					verticalCompact={false}
					horizontalCompact={false}
					preventCollision={false}

					autoSize={true}
					containerPadding={[1, 1]}
					// margin={[0,0]}

					onLayoutChange={(layout, layouts) =>
						this.onLayoutChange(layout, layouts)
					}
				>
					<div key="1" style={{ background: '#455162' }} data-grid={{ w: halfwidth, h: 10, x: 0, y: 0, minW: 2, minH: 1, static: true }}>
						<div style={{ "margin-left": "20px", "margin-top": "20px", "margin-right": "20px", "font-family": "sans-serif", "text-align": "center" }}>

							<Table bordered striped style={{ color: "white" }}>


								<thead>
									<tr>
										<th> </th>
										{
											this.state.stats.map(s => (
												<th> {s.PLAYER_NAME}</th>

											))


										}


										{/* <th>Last Name</th>
							<th>Username</th> */}
									</tr>
								</thead>
								<tbody>

									<tr>

										<td>PTS</td>
										{
											this.state.stats.map(s => (
												<td> {formatDec(s.PTS)}</td>

											))


										}
										{/* <td>Mark</td>
							<td>Otto</td>
							<td>@mdo</td> */}
									</tr>



									<tr>
										<td>REB</td>
										{
											this.state.stats.map(s => (
												<td> {formatDec(s.REB)}</td>

											))


										}

									</tr>
									<tr>
										<td>AST</td>
										{
											this.state.stats.map(s => (
												<td> {formatDec(s.AST)}</td>

											))


										}

									</tr>
									<tr>
										<td>3PA</td>
										{
											this.state.stats.map(s => (
												<td> {formatDec(s.FG3A)}</td>

											))


										}

									</tr>
								</tbody>
							</Table>


						</div>
					</div>





				</ResponsiveReactGridLayout>
				<div>
					{
						// this.state.players.map(post => (
						[0, 0, 0, 0, 0, 0, 0].map(post => (

							<li align="start">
								<div>
									<p> </p>
									<p> </p>
									<p> </p>
									{/* <p> </p> */}


								</div>
							</li>


						))
					}
				</div>





			</div>


		);


	}

}

export default Main1;

