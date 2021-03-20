import React, { Component } from 'react';

import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { WidthProvider } from "react-grid-layout";

import BarChart from '../graphs/BarChart'
import { CONFIG } from '../config.js';
import * as d3 from "d3";
import axios from 'axios'
import MultiDropdown from '../components/MultiDropdown';

import ScatterPlot from "../graphs/Scatterplot"

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
            randomData: [],

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
            selectedP3: false,

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
            if (p.option === "PTS") { p["selectedP2"] = true; }
            if (p.option === "AST") { p["selectedP3"] = true; }

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

        const randomData = [[5, 10], [10, 17], [25, 20]]

        this.setState({ stats: stats, uniqList: uniqList, numberKeys: numberKeys, uniqKeys: uniqKeys, uniqTeams: uniqTeams, randomData: randomData })


    }



    setDefault = (shotlog) => {

        shotlog.map(i => i.key = "shotlog");

        // shotlog.map((p, i) => {
        // 	if (p.PLAYER_NAME === "Stephen Curry") { p["selectedP1"] = true; }
        // })
        // shotlog.map((p, i) => {
        // 	if (p.PLAYER_NAME === "Giannis") { p["selectedP2"] = true; }
        // })

        // shotlog.map((p, i) => p.selectedP1 = true);
        shotlog.map((p, i) => p.selectedP1 = false);
        shotlog.map((p, i) => p.selectedP2 = true);


        shotlog.map((p, i) => p.id = p.PLAYER_ID);
        shotlog.map((p, i) => p.shotid = i);

        shotlog.map((p, i) => p.x = (p.LOC_X + 250) / 10);
        shotlog.map((p, i) => p.y = (p.LOC_Y + 50) / 10);





        const uniqNames = [...new Set(shotlog.map(d => d.PLAYER_NAME))]

        this.setState({ shotlog: shotlog })


        var uniqShotTypes = [...new Set(shotlog.map(d => d.SHOT_TYPE))]
        // uniqShotTypes = uniqShotTypes.slice(0,5)

        var uniqIds = [...new Set(shotlog.map(d => d.PLAYER_ID))]
        var uniqList = shotlog.map((p, index) => ({
            option: p["PLAYER_NAME"],
            id: p["PLAYER_ID"],

            // selectedP1: true,
            selectedP2: true,
            selectedP1: false,
            // selectedP2: false,
            key: "shotlog"
        }))

        uniqList = uniqList.filter((item, index) => uniqIds.includes(item.id))
        // uniqList = uniqList.filter((item,index)=> uniqList.id.indexOf(item.id)===index)                                           
        uniqList = uniqList.filter((uniqList, index, self) =>
            index === self.findIndex((t) => (t.id === uniqList.id)))

        uniqList.map((p, i) => p.listid = i);

        this.setState({ uniqList: uniqList, uniqShotTypes: uniqShotTypes })


        var agg = []
        uniqList.forEach(function myFunction(item, index, arr) {
            var p = shotlog.filter((player, index) => player.id === item.id)

            var sumplayer = p.map(item => item.FGM).reduce((prev, next) => prev + next);
            agg[index] = { pid: item.id, player: item.option, sumPlayer: sumplayer }

        })

        this.setState({ sumFGA: agg })



    }

    toggleSingleDropDown = (value, key) => {
        let data = [...this.state[key]];
        data.forEach(item => item.selected = false);
        data[value].selected = true;


        this.setState({ key: data });

    }

    filterAndSort_Laps = (selectedRace, selectedSeason, laptimes, filtQ) => {

        var filtered = laptimes.filter(d => (d.raceName === selectedRace.raceName && d.season === selectedSeason.season))
        return filtered

    }


    toggleSelected = (id, key, uniqList, listid, selCol, singleMode) => {
        if (singleMode) {
            // deep copy
            let temp = JSON.parse(JSON.stringify(this.state[key]))
            let temp2 = JSON.parse(JSON.stringify(this.state[key]))


            temp.map(d => d[selCol] = false)
            uniqList.map(d => d[selCol] = false)


            temp.forEach(function myFunction(item, index, arr) {
                if (arr[index].id === id) {

                    temp[index][selCol] = !temp2[index][selCol]


                }

            })
            uniqList[listid][selCol] = !uniqList[listid][selCol]

            // uniqList[listid][selCol] = true; // !uniqList[listid][selCol]
            this.setState({
                [key]: temp,
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
                    breakpoints={{ lg: 1200, md: 1200, sm: 1200, xs: 1200, xxs: 1200 }}
                    // cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    cols={{ lg: colsize, md: colsize, sm: colsize, xs: colsize, xxs: colsize }}

                    rowHeight={30}
                    layouts={this.state.layouts}
                    margin={[10, 10]}
                    verticalCompact={false}
                    horizontalCompact={false}
                    preventCollision={true}

                    autoSize={true}
                    // containerPadding={[1,1]}
                    // margin={[0,0]}

                    onLayoutChange={(layout, layouts) =>
                        this.onLayoutChange(layout, layouts)
                    }
                >


                    <div key="1" style={{ background: '#455162' }} data-grid={{ w: qwidth, h: r1h, x: qwidth, y: 0, minW: 2, minH: 1, static: false, autoSize: true }}>
                        <h2 style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }} >
                            BarChart
                        </h2>

                        <div className="asd" style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }}>
                            <div style={{ color: "black" }}>
                                <MultiDropdown
                                    titleHelper="Category"
                                    title="Select Category"
                                    col="PLAYER_NAME"
                                    uid="PLAYER_ID"
                                    selCol={"selectedP1"}

                                    list={this.state.uniqKeys}
                                    uniqList={this.state.uniqKeys}
                                    // toggleItem={this.toggleSelect}
                                    // singleMode={false}
                                    singleMode={true}



                                    toggleItem={this.toggleSelected}

                                // toggleItem={this.hei.bind(this)}

                                />
                                <div><br></br></div>

                                <div>
                                    {
                                        this.state.uniqKeys.filter(k => k["selectedP1"] === true).length > 0 ? (
                                            <BarChart data={this.state.stats} size={[400, 200]} col={this.state.uniqKeys.filter(k => k["selectedP1"])[0].option} />
                                        ) : (
                                                ""
                                            )}

                                </div>

                            </div>


                        </div>

                    </div>



                    <div key="2" style={{ background: '#455162' }} data-grid={{ w: qwidth, h: r1h, x: 0, y: 0, minW: 2, minH: 1, static: true }}>


                        <h2 style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }}>
                            X Axis
					</h2>
                        <div className="asd" style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px" }}>

                            <div style={{ color: "black" }}>
                                <MultiDropdown
                                    titleHelper="Category"
                                    title="Select Category"
                                    col="PLAYER_NAME"
                                    uid="PLAYER_ID"
                                    selCol={"selectedP2"}

                                    list={this.state.uniqKeys}
                                    uniqList={this.state.uniqKeys}
                                    // toggleItem={this.toggleSelect}
                                    // singleMode={false}
                                    singleMode={true}



                                    toggleItem={this.toggleSelected}

                                // toggleItem={this.hei.bind(this)}

                                />

                            </div>



                        </div>

                        <h2 style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }}>
                            Y Axis
					</h2>
                        <div className="asd" style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px" }}>

                            <div style={{ color: "black" }}>
                                <MultiDropdown
                                    titleHelper="Category"
                                    title="Select Category"
                                    col="PLAYER_NAME"
                                    uid="PLAYER_ID"
                                    selCol={"selectedP3"}

                                    list={this.state.uniqKeys}
                                    uniqList={this.state.uniqKeys}
                                    // toggleItem={this.toggleSelect}
                                    // singleMode={false}
                                    singleMode={true}



                                    toggleItem={this.toggleSelected}

                                // toggleItem={this.hei.bind(this)}

                                />

                            </div>



                        </div>

                    </div>


                    <div key="4" style={{ background: '#455162', }} data-grid={{ w: halfwidth, h: 12, x: 0, y: r1h, minW: 2, minH: 1, static: false }}>
                        <h2 style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }} >
                            ScatterPlot
                        </h2>

                        <div style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "20px" }}>

                            <ScatterPlot
                                //  data={this.state.randomData}
                                //  xdata={this.state.randomData.map(d => d[0])}
                                xdata={stats.map(d => [d["PLAYER_NAME"],
                                d[typeof this.state.uniqKeys.filter(k => k["selectedP2"])[0] !== "undefined" ? this.state.uniqKeys.filter(k => k["selectedP2"])[0].option : "PTS"]])}
                                ydata={stats.map(d => [d["PLAYER_NAME"],
                                d[typeof this.state.uniqKeys.filter(k => k["selectedP3"])[0] !== "undefined" ? this.state.uniqKeys.filter(k => k["selectedP3"])[0].option : "REB"]])}


                                //  ydata={this.state.stats.map(d => [d["PLAYER_NAME"],d[this.state.uniqKeys.filter(k => k["selectedP1"])[0].option]])}

                                //  ydata={this.state.randomData.map(d => d[1])}

                                width={800}
                                height={400}
                                padding={30}
                                //   xCol={"PTS"}
                                xCol={typeof this.state.uniqKeys.filter(k => k["selectedP2"])[0] !== "undefined" ? this.state.uniqKeys.filter(k => k["selectedP2"])[0].option : "PTS"}

                                yCol={typeof this.state.uniqKeys.filter(k => k["selectedP3"])[0] !== "undefined" ? this.state.uniqKeys.filter(k => k["selectedP3"])[0].option : "REB"}



                            />

                        </div>


                    </div>




                </ResponsiveReactGridLayout>

                <div>
                    {
                        // t.map(post => (
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(post => (

                            <li align="start">
                                <div>
                                    {/* <p>{post.SHOT_DIST} : {post.SHOT_PTS} </p> */}
                                    <p>
                                        {/* {post.player} */}
                                        {/* {post.sumPlayer} */}

                                    </p>

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

