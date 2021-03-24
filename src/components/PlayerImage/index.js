import React from 'react';
import PropTypes from 'prop-types';

import {apiOrigin} from '../../utils/config';
import {Img} from './style';

const PlayerImage = ({player}) => {
  const endpoint = new URL(apiOrigin);
  endpoint.pathname = `/data/images/${player}.png`;

  return <Img src={endpoint.href} alt="Player's portrait" />;
};

PlayerImage.propTypes = {
  player: PropTypes.string.isRequired,
};

export default PlayerImage;
