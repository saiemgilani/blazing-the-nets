import React, { Component } from 'react';

import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { WidthProvider } from "react-grid-layout";

import BarChart from '../graphs/BarChart'
import { CONFIG } from '../config.js';
import * as d3 from "d3";
import axios from 'axios'
import MultiDropdown from '../components/MultiDropdown';

// import BarChart from "../graphs/BarChart"
import { Table } from 'react-bootstrap'

import RangeSlider from "../components/RangeSlider"


// import Shotchart from "../graphs/Shotchart"
import Shotchart from "../graphs/myShotChart"

import DonutChart from "../graphs/DonutChart"

const ResponsiveReactGridLayout = WidthProvider(ResponsiveGridLayout);
// const originalLayouts = getFromLS("layouts") || {};


const formatDec = d3.format(".2f")
const formatPerc = d3.format(".0%")

class Main1 extends Component {

    constructor(props) {
        super(props)
        this.state = {
            shotlog: [],
            uniqList: [],
            uniqTeams: [],

            uniqShotTypes: [],
            selShotTypes: [],
            // selShotTypes:["Jump Shot", "Step Back Jump shot" ,"Running Jump shot","Pullup Jump shot","Driving Layup"],



            wholePts: [],
            wholeAst: [],
            test: [],
            response: [],
            bardata: [12, 25, 6, 6, 9, 10],

            data: [[0.1, 0.2], [0.3, 0.2], [4, 2], [4, 1]],
            minCount: 1,
            // chartType: 'scatter',//'hexbin', // 'scatter'
            chartType: 'hexbin', // 'scatter'

            displayToolTips: true,

            isToggleOn: true,
            dist: [0, 40],


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

        const racesRequest = axios.get(CONFIG.SHOTS)
            .then(response =>
                response.data
            ).then(shotlog => this.setDefault(shotlog))

    }

    setDefault = (shotlog) => {

        shotlog = shotlog.slice(0, 1000)
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



        var agg = []
        uniqList.forEach(function myFunction(item, index, arr) {
            var p = shotlog.filter((player, index) => player.id === item.id)

            var sumplayer = p.map(item => item.FGM).reduce((prev, next) => prev + next);
            agg[index] = { pid: item.id, player: item.option, sumPlayer: sumplayer }

        })

        // this.setState({ sumFGA: agg})

        var uniqTeams = [...new Set(shotlog.map(d => d.TEAM))]

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

        var dist = shotlog.map(s => (s.SHOT_DIST))

        this.setState({ uniqList: uniqList, uniqShotTypes: uniqShotTypes, uniqTeams: uniqTeams, sumFGA: agg, dist: dist })


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

    handleShotTypeChange(type, add, reset) {
        if (reset === "reset") {
            this.setState({
                selShotTypes: []

            })
        }

        else if (add) {
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
        if (this.state.isToggleOn === true) {
            // if (this.state.isToggleOn === false) {

            this.setState({
                isToggleOn: !this.state.isToggleOn,
                chartType: 'scatter'
            })
        }
        else if (this.state.isToggleOn === false) {
            // else if (this.state.isToggleOn === true) {

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

    filterSelected(df, uniqList, selCol, col) {
        if (uniqList.filter(t => t[selCol] === true).length > 0) {
            var selPlayer = uniqList.filter(t => t[selCol] === true).map(t => t.option)
            df = df.filter((shot, index) => selPlayer.includes(shot[col]))
            // ab = ab.slice(0,6)
        }

        return df
    }

    filterShotLog(df) {
        // var df = shotlog
        df = this.filterSelected(df, this.state.uniqList, "selectedP1", "PLAYER_NAME")


        df = this.filterSelected(df, this.state.uniqTeams, "selectedP1", "TEAM")



        return df
    }

    aggregate(df, uniqList, selCol, aggCol) {
        var agg = []
        if (df.length > 0) {
            uniqList.forEach(function myFunction(item, index, arr) {
                // arr[index] = item * 10;
                // uniqList = uniqList.filter((item, index) => uniqIds.includes(item.id))

                var p = df.filter((player, index) => player[selCol] === item)
                if (p.length > 0) {
                    var sum = p.map(item => item[aggCol]).reduce((prev, next) => prev + next);
                    agg[index] = { SHOT_TYPE: item, sumShotType: sum }

                }

            })

            agg = agg.filter((shot, index) => shot.sumShotType > 5)
            agg = agg.sort((a, b) => (a.sumShotType < b.sumShotType) ? 1 : ((b.sumShotType < a.sumShotType) ? -1 : 0));
            // if (this.state.selShotTypes.length > 0)
            // {
            //     agg = agg.filter((shot, index)=>  this.state.selShotTypes.includes(shot.player))

            // }
            agg = agg.slice(0, 6)


        }
        return agg
    }



    render() {

        // const names = this.state.shotlog.map(post => post.firstname)
        const { fnames, shotlog, uniqList, sumFGA, uniqShotTypes, dist } = this.state

        var binrange = [1, 20]

        // var ab = shotlog.filter((p) => (p["selectedP1"] === true))
        // ab = ab.filter((p) => (p["selectedP1"] === true))

        var ab = this.filterShotLog(shotlog)

        ab = ab.filter((p) => (p.SHOT_DIST >= this.state.distL) && (p.SHOT_DIST <= this.state.distR))

        var agg = this.aggregate(ab, uniqShotTypes, "SHOT_TYPE", "FGA")

        if (this.state.selShotTypes.length > 0) {
            ab = ab.filter((shot, index) => this.state.selShotTypes.includes(shot.SHOT_TYPE))
            // ab = ab.slice(0,6)
        }


        if (ab.length > 0) {
            var allFGA = ab.map(item => item.FGA).reduce((prev, next) => prev + next);
            var allFGM = ab.map(item => item.FGM).reduce((prev, next) => prev + next);
            var allSP = ab.map(item => item.SHOT_PTS).reduce((prev, next) => prev + next);
            var allPPS = allSP / allFGA
            var allFREQ = allFGA / allFGA

            var js = ab.filter((shot, i) => shot.SHOT_TYPE === "Jump Shot")

            if (js.length > 0) {

                var jsFGA = js.map(item => item.FGA).reduce((prev, next) => prev + next);
                var jsFGM = js.map(item => item.FGM).reduce((prev, next) => prev + next);
                var jsSP = js.map(item => item.SHOT_PTS).reduce((prev, next) => prev + next);
                var jsPPS = jsSP / jsFGA
                var jsFREQ = jsFGA / allFGA

            }
        }
        else {
            var allFGA = 0
            var allFGM = 0
            var allPPS = 0
            var allFREQ = 0

            var jsFGA = 0
            var jsFGM = 0
            var jsPPS = 0
            var jsFREQ = 0
        }

        var r1h = 8
        var r2h = 10
        var fullwidth = 12
        var halfwidth = fullwidth / 2
        var qwidth = halfwidth / 2
        var colsize = 12

        return (
            <div style={{ background: '#57667B', color: "white" }}>
                {/* // <div >  */}

                <div>
                    <button onClick={this.handleClick} className="white" style={{ "margin-left": "10px" }} >
                        {this.state.isToggleOn ? 'Scatter' : 'Hexbin'}
                        {/* {this.state.isToggleOn ? 'Hexbin' : 'Scatter'} */}

                    </button>

                </div>
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
                    preventCollision={true}

                    autoSize={true}
                    // containerPadding={[1,1]}

                    onLayoutChange={(layout, layouts) =>
                        this.onLayoutChange(layout, layouts)
                    }
                >
                    <div key="1" style={{ background: '#455162' }} data-grid={{ w: qwidth, h: r1h, x: 0, y: 0, minW: 2, minH: 1, static: true }}>


                        <h2 style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px" }}>
                            Player
					</h2>
                        <div className="asd" style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }}>
                            <div style={{ color: "black" }}>

                                <MultiDropdown
                                    titleHelper="Player"
                                    title="Select Players"
                                    col="PLAYER_NAME"
                                    uid="PLAYER_ID"
                                    selCol={"selectedP1"}

                                    list={this.state.shotlog}
                                    uniqList={uniqList}
                                    toggleItem={this.toggleSelected}

                                    singleMode={false}
                                    // singleMode={true}

                                    maxwidth={(1200 / qwidth + 50).toString() + "px"}
                                    maxListHeight={"170px"}
                                />
                            </div>

                            {/* {wholePts} */}
                        </div>
                        <h2 style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }}>
                            Distance
					</h2>
                        <div className="asd" style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "-10px" }}>
                            <div>

                                <RangeSlider onChangeYear={this.handleDistChange.bind(this)}
                                    data={dist}
                                    handle1={"handle3"}
                                    handle2={"handle4"}
                                    sGroup={"test"}
                                    label={"Distance"}

                                    left={this.state.distL}
                                    right={this.state.distR}
                                    width={460}
                                    height={50}
                                />
                            </div>

                            {/* {wholePts} */}
                        </div>

                    </div>
                    <div key="2" style={{ background: '#455162' }} data-grid={{ w: qwidth, h: r1h, x: qwidth, y: 0, minW: 2, minH: 1, static: true }}>


                        <h2 style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px" }}>
                            Teams
					</h2>
                        <div className="asd" style={{ display: 'flex', justifyContent: "flex-start", "margin-left": "10px", "margin-top": "10px" }}>
                            <div style={{ color: "black" }}>

                                <MultiDropdown
                                    titleHelper="Teams"
                                    title="Select Teams"
                                    col="TEAM_NAME"
                                    uid="TEAM_NAME"
                                    selCol={"selectedP1"}

                                    list={this.state.uniqTeams}
                                    uniqList={this.state.uniqTeams}
                                    toggleItem={this.toggleSelected}

                                    singleMode={false}
                                    // singleMode={true}

                                    maxwidth={(1200 / qwidth + 50).toString() + "px"}
                                    maxListHeight={"200px"}
                                />
                            </div>

                            {/* {wholePts} */}
                        </div>
                    </div>



                    {/* <div key="3" style={{ background: '#455162' }} data-grid={{ w: halfwidth, h: r1h, x: halfwidth, y: 0, minW: 2, minH: 1, static: true }}>




                    </div> */}

                    <div key="4" style={{ background: '#455162' }} data-grid={{ w: qwidth, h: 7, x: 0, y: r1h, minW: 2, minH: 1, static: false }}>
                        {/* <h2>P1</h2> */}

                        {/* <FeatureFour data={[5,10,1,3]} size={[500,500]}/>  */}
                        {/* <div  style={{ "margin-left":"20px","margin-top":"20px",  "font-family": "sans-serif", "text-align": "center"  }}> */}
                        {/* <div  style={{ "margin-left":"20px","margin-top":"20px",  "font-family": "sans-serif", "text-align": "center"  }}> */}
                        <div>

                            <Table borderless striped style={{ color: "white" }}>


                                <thead>
                                    <tr>
                                        {/* <th>#</th> */}
                                        <th>Shot Type</th>
                                        <th>FGM</th>
                                        <th>FGA</th>
                                        <th>PPS</th>
                                        <th>FREQ%</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {/* <td>1</td> */}
                                        <td>All</td>
                                        <td>
                                            {allFGM}
                                        </td>
                                        <td>
                                            {allFGA}
                                        </td>
                                        <td>
                                            {formatDec(allPPS)}
                                        </td>
                                        <td>
                                            {formatPerc(allFREQ)}

                                        </td>

                                    </tr>
                                    <tr>
                                        {/* <td>2</td> */}
                                        <td>Jump Shot</td>

                                        <td>
                                            {jsFGM}
                                        </td>
                                        <td>
                                            {jsFGA}

                                        </td>
                                        <td>
                                            {formatDec(jsPPS)}

                                        </td>
                                        <td>
                                            {formatPerc(jsFREQ)}
                                        </td>

                                    </tr>
                                    <tr>
                                        {/* <td>3</td> */}
                                        {/* <td colSpan="2">Larry the Bird</td> */}
                                        <td>Step Back</td>


                                    </tr>
                                    <tr>

                                        <td>Pullup</td>


                                    </tr>
                                    <tr>

                                        <td>Layup</td>

                                        {/* <td>RA</td> */}

                                    </tr>

                                </tbody>
                            </Table>




                        </div>


                    </div>
                    <div key="5" style={{ background: '#455162', }} data-grid={{ w: qwidth, h: 12, x: qwidth, y: r1h, minW: 2, minH: 1, static: false }}>
                        <h2>Donut</h2>
                        {/* <BarChart  data={piedata} size={[200, 200] }/> display: "block","margin":"auto" */}

                        <DonutChart

                            data={agg}
                            onSelectedShotType={this.handleShotTypeChange.bind(this)}
                        // data={piedata}

                        // data={[5, 2, 1, 3, 4, 9]}
                        // data={piedata}

                        />



                    </div>
                    <div key="6" style={{ background: '#455162' }} data-grid={{ w: qwidth, h: 12, x: halfwidth, y: r1h, minW: 2, minH: 1 }}>
                        <h2>P1</h2>
                        {/* <div style={{display: 'flex', justifyContent: "center", "margin-left": "0px", background: '#135162' }}> */}
                        <Shotchart
                            data={ab}
                            //  xdata={xloc} ydata={yloc}
                            playerId={this.props.playerId}
                            minCount={this.state.minCount}
                            chartType={this.state.chartType}
                            displayToolTips={this.state.displayToolTips}
                            width={400}
                            namee={"p1"}
                        />
                        {/* </div> */}



                    </div>


                    <div key="7" style={{ background: '#455162' }} data-grid={{ w: qwidth, h: 20, x: halfwidth + qwidth - 0.2, y: r1h + 24, minW: 2, minH: 1 }}>
                        <h2>P1</h2>




                    </div>






                </ResponsiveReactGridLayout>



            </div>


        );


    }

}

export default Main1;

