import { createSelector } from 'reselect';
import d3 from '../d3';

export const getPlayers = state => state.players.payload;
export const getHighlightPlayerId = state => state.charts.highlightPlayerId;

export const getFilteredPlayers = createSelector(
  getPlayers,
  (players) => {
    const data = d3.values(players)
      .filter(d => d.hasStats)
      .filter(d => d.min > 400);

    return data;
  }
);
