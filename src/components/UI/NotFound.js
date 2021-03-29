import React from 'react';
import styled from 'styled-components';

// eslint-disable-next-line import/prefer-default-export
export const Div = styled.div`
  border-radius: 0.1rem;
  background: #eaeaea;
  display: block;
  max-width: 100%;
  margin-top: 75px;
`;
const NotFound = () => {
    return (
        <Div className="not_found_container">
            <div>
                <div>Sorry <span role="img" aria-label="emoji">😞</span></div>
                <div>Page Not Found</div>                
            </div>
        </Div>
    );
};

export default NotFound;