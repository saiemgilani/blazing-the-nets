import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import Router from 'react-router/BrowserRouter';
import { RouterToUrlQuery } from 'react-url-query';

import App from './App';
import '../assets/base.scss';

const Root = ({ store }) => (
  <Provider store={store}>
    <Router>
      <RouterToUrlQuery>
        <App />
      </RouterToUrlQuery>
    </Router>
  </Provider>
);

Root.propTypes = {
  store: PropTypes.object,
};

export default Root;
