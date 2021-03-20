import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import Home from './views/Home'
import Table from './views/Table'
// import Scatter from './components/Scatter'
// import Bars from './views/Bars'
// import Filter from './views/Filtering'
// import Better from './views/Better'
// import Slider from './views/Slider'
// import Test from './views/Test'



// import Scatter from './views/ScatterView'
// import Axistest from './views/Axistest'
// import Shotchart from './views/ShotchartView'
// import myShotchart from './views/myShotchartView'
import grid from './views/Grid'
// import Bubble from './views/BubbleView'
import Template from './views/Template'




const Main = () => (
  <main>
    <BrowserRouter>
      <Switch>
        {/* <Route exact path='/' component={Home}/>   */}
        <Route exact path='/' component={Home}/>     
        <Route path='/template' component={Template}/>
        <Route path='/compare' component={grid}/>
        {/* <Route path='/scatter' component={Scatter}/> */}
        <Route path='/table' component={Table}/>
        {/* <Route path='/bubble' component={Bubble}/>
        <Route path='/filter' component={Filter}/>
        <Route path='/barchart' component={Better}/>
        <Route path='/slider' component={Slider}/>
        <Route path='/test' component={Axistest}/> */}
        {/* <Route path='/slider' component={sibs}/> */}
        {/* <Route path='/shotchart' component={Shotchart}/> */}
        {/* <Route path='/my' component={myShotchart}/> */}
        {/* <Route path='/scatter' component={Scatter}/> */}
      </Switch>
    </BrowserRouter>
  </main>
  
)

export default Main
