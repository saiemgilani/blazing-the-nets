import React from 'react';
import styled from 'styled-components';

const Footer = styled.footer`
  text-align: center;
  font-family: sans-serif;
  font-size: 14px;
  color: #181818;
  padding-top: 10px;
  small {
    font-size: 0.75rem;
  }
`;
const A = styled.a`
  text-decoration: none;
  color: #333;
`;

const FooterComponent = () => (
  <Footer>
    <p>
      Created by <A href="https://twitter.com/saiemgilani">Saiem Gilani</A>
    </p>
  </Footer>
);

export default FooterComponent;
