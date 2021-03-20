import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Match from 'react-router/Match';

import { fetchDataIfNeeded } from '../state/reducer';

import OverviewPage from './OverviewPage';

const mapStateToProps = () => ({
});

class App extends Component {
  static propTypes = {
    dispatch: PropTypes.func,
  }

  componentWillMount() {
    const { dispatch } = this.props;
    dispatch(fetchDataIfNeeded());
  }

  render() {
    return (
      <div className="App">
        <div className="container">
          <Match
            exactly
            pattern="/"
            component={OverviewPage}
          />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(App);
