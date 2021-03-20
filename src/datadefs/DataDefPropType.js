import { PropTypes } from 'react';

export default PropTypes.shape({
  label: PropTypes.string,
  unit: PropTypes.string,
  formatter: PropTypes.func,
  shortFormatter: PropTypes.func,
});
