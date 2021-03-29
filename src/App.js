import React from 'react';
import styled from 'styled-components';
import {BrowserRouter as Router} from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Routes from './routes';

const Div = styled.div`
  padding: 0 1em;
  @media only screen and (min-width: 768px) {
    padding: 0 2em;
  }
`;

// const H1 = styled.h1`
//   color: #070707;
// `;

const App = (props) => {
  return(
    <Router>
      {/* <Navbar />
      <Div className="App">
        <ChartDashboard />
      </Div>
      <Footer /> */}
      <ScrollToTop>
        <Routes {...props}/>
      </ScrollToTop>
    </Router>
  )
};

export default App;