import PropTypes from 'prop-types';

import {apiOrigin} from '../../utils/config';
import {Img} from './style';

const PlayerImage = ({player}) => {
  const endpoint = new URL(apiOrigin);
  endpoint.pathname = `/data/images/Players/${player}.png`;

  return <Img src={endpoint.href} alt="Player's portrait" width={180}  mode='fit' />;
};

PlayerImage.propTypes = {
  player: PropTypes.string.isRequired,
};

export default PlayerImage;
