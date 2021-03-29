import React from 'react';
import styled from 'styled-components';
import {BrowserRouter as Router} from 'react-router-dom';
import ChartDashboard from './containers/ChartDashboard';
import Navbar from './containers/Navbar/Navbar';
import Footer from './containers/Footer';
import { firebase } from './firebase';

const Div = styled.div`
  padding: 0 1em;
  @media only screen and (min-width: 768px) {
    padding: 0 2em;
  }
`;

// const H1 = styled.h1`
//   color: #070707;
// `;

const App = () => (
  <Router>
      <Navbar />
      <Div className="App">
        <ChartDashboard />
      </Div>
      <Footer />
  </Router>
);

export default App;
