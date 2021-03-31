import React from 'react';
import PropTypes from 'prop-types';

import {apiOrigin} from '../../utils/config';
import {Img} from './style';

const TeamImage = ({team}) => {
  const endpoint = new URL(apiOrigin);
  endpoint.pathname = `/data/images/teams/${team}.png`;

  return <Img src={endpoint.href} alt="Team's logo" width={180}  mode='fit' />;
};

TeamImage.propTypes = {
  team: PropTypes.string.isRequired,
};

export default TeamImage;
