import { combineReducers } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import * as Api from '../api/api';

/**
 * Action creators for requesting and receiving data. Identity used for payload
 */
export const requestData = createAction('REQUEST_DATA');
export const receiveData = createAction('RECEIVE_DATA');
export const highlightPlayer = createAction('HIGHLIGHT_PLAYER');

/**
 * Action creator to fetch data from the API
 */
const fetchData = () => (dispatch) => {
  dispatch(requestData());
  return Api.getAllData().then(data => dispatch(receiveData(data)));
};

/**
 * Helper to check if we have already fetched the data or not
 */
function shouldFetchData(state) {
  // since players is derived from data currently, we can just check it.
  return !state.players.payload && !state.players.isFetching;
}

/**
 * Action creator to fetch data only if we haven't fetched it before.
 */
export const fetchDataIfNeeded = () => (dispatch, getState) => (
  shouldFetchData(getState()) ? dispatch(fetchData()) : Promise.resolve()
);


/**
 * Players reducer
 */
const players = handleActions({
  REQUEST_DATA: () => ({
    isFetching: true,
  }),

  RECEIVE_DATA: (state, action) => ({
    payload: action.payload.players,
    isFetching: false,
  }),
}, { isFetching: false });

/**
 * Draft years reducer
 */
const draftYears = handleActions({
  REQUEST_DATA: () => ({
    isFetching: true,
  }),

  RECEIVE_DATA: (state, action) => ({
    payload: action.payload.draftYears,
    isFetching: false,
  }),
}, { isFetching: false });

/**
 * Drafts reducer
 */
const drafts = handleActions({
  REQUEST_DATA: () => ({
    isFetching: true,
  }),

  RECEIVE_DATA: (state, action) => ({
    payload: action.payload.drafts,
    isFetching: false,
  }),
}, { isFetching: false });

/**
 * Teams reducer
 */
const teams = handleActions({
  REQUEST_DATA: () => ({
    isFetching: true,
  }),

  RECEIVE_DATA: (state, action) => ({
    payload: action.payload.teams,
    isFetching: false,
  }),
}, { isFetching: false });

/**
 * Executives reducer
 */
const executives = handleActions({
  REQUEST_DATA: () => ({
    isFetching: true,
  }),

  RECEIVE_DATA: (state, action) => ({
    payload: action.payload.executives,
    isFetching: false,
  }),
}, { isFetching: false });


const charts = handleActions({
  HIGHLIGHT_PLAYER: (state, action) => ({
    ...state,
    highlightPlayerId: action.payload,
  }),
}, {});

export default combineReducers({
  charts,
  drafts,
  draftYears,
  executives,
  players,
  teams,
});
