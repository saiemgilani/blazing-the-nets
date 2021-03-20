import { Formatters, DataType } from 'react-taco-table';
import dataDefinition from './dataDefinition';

function metric(props) {
  return {
    ...dataDefinition(props),
    dataType: 'metric',
  };
}

export const metricsById = {
  draftYear: metric({
    type: DataType.NumberOrdinal,
    id: 'draftYear',
    label: 'Draft Year',
  }),
  draftPick: metric({
    type: DataType.NumberOrdinal,
    id: 'draftPick',
    label: 'Draft Pick',
  }),
  seasons: metric({
    type: DataType.NumberOrdinal,
    id: 'seasons',
    label: 'Seasons',
  }),
  gp: metric({
    type: DataType.Number,
    id: 'gp',
    label: 'Games Played',
    formatter: Formatters.commaFormat,
  }),
  min: metric({
    type: DataType.Number,
    id: 'min',
    label: 'Minutes',
    formatter: Formatters.commaFormat,
  }),
  pts: metric({
    type: DataType.Number,
    id: 'pts',
    label: 'Points',
    formatter: Formatters.commaFormat,
  }),
  trb: metric({
    type: DataType.Number,
    id: 'trb',
    label: 'Rebounds',
    formatter: Formatters.commaFormat,
  }),
  ast: metric({
    type: DataType.Number,
    id: 'ast',
    label: 'Assist',
    formatter: Formatters.commaFormat,
  }),
  fgpct: metric({
    type: DataType.Number,
    id: 'fgpct',
    label: 'FG%',
    formatter: Formatters.percentFormat(1),
    shortFormatter: Formatters.percentFormat(0),
  }),
  fg3pct: metric({
    type: DataType.Number,
    id: 'fg3pct',
    label: '3PT FG%',
    formatter: Formatters.percentFormat(1),
    shortFormatter: Formatters.percentFormat(0),
  }),
  ftpct: metric({
    type: DataType.Number,
    id: 'ftpct',
    label: 'FT%',
    formatter: Formatters.percentFormat(1),
    shortFormatter: Formatters.percentFormat(0),
  }),
  minpg: metric({
    type: DataType.Number,
    id: 'minpg',
    label: 'Minutes per game',
    formatter: Formatters.decFormat(1),
    shortFormatter: Formatters.decFormat(0),
  }),
  ptspg: metric({
    type: DataType.Number,
    id: 'ptspg',
    label: 'Points per game',
    formatter: Formatters.decFormat(1),
    shortFormatter: Formatters.decFormat(0),
  }),
  trbpg: metric({
    type: DataType.Number,
    id: 'trbpg',
    label: 'Rebounds per game',
    formatter: Formatters.decFormat(1),
    shortFormatter: Formatters.decFormat(0),
  }),
  astpg: metric({
    type: DataType.Number,
    id: 'astpg',
    label: 'Assists per game',
    formatter: Formatters.decFormat(1),
    shortFormatter: Formatters.decFormat(0),
  }),
  ws: metric({
    type: DataType.Number,
    id: 'ws',
    label: 'Win Shares',
    formatter: Formatters.decFormat(1),
    shortFormatter: Formatters.decFormat(0),
  }),
  wsper48: metric({
    type: DataType.Number,
    id: 'wsper48',
    label: 'Win Shares per 48',
    formatter: Formatters.decFormat(2),
    shortFormatter: Formatters.decFormat(2),
  }),
  bpm: metric({
    type: DataType.Number,
    id: 'bpm',
    label: 'BPM',
    formatter: Formatters.plusMinusFormat(1),
    shortFormatter: Formatters.plusMinusFormat(0),
  }),
  vorp: metric({
    type: DataType.Number,
    id: 'vorp',
    label: 'VORP',
    formatter: Formatters.decFormat(1),
    shortFormatter: Formatters.decFormat(0),
  }),
};

export default [
  metricsById.draftYear,
  metricsById.draftPick,
  metricsById.seasons,
  metricsById.gp,
  metricsById.min,
  metricsById.pts,
  metricsById.trb,
  metricsById.ast,
  metricsById.fgpct,
  metricsById.fg3pct,
  metricsById.ftpct,
  metricsById.minpg,
  metricsById.ptspg,
  metricsById.trbpg,
  metricsById.astpg,
  metricsById.ws,
  metricsById.wsper48,
  metricsById.bpm,
  metricsById.vorp,
];
