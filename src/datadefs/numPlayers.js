import { Formatters } from 'react-taco-table';
import dataDefinition from './dataDefinition';

export default dataDefinition({
  id: 'numPlayers',
  label: 'Number of Players',
  formatter: Formatters.commaFormat,
});
