import React from 'react';
import styled from 'styled-components';

const Footer = styled.footer`
  text-align: center;
  font-family: sans-serif;
  font-size: 14px;
  color: hsl(0, 6%, 94%);
  background: hsl(0, 0%, 6%);
  padding-top: 0.6px;
  padding-bottom: 0.95rem;
  small {
    font-size: 0.95rem;
  }
  border-bottom: 4px solid hsl(0, 4%, 94%);
`;
const A = styled.a`
  text-decoration: none;
  color: hsl(0, 4%, 94%);
`;
const FooterComponent = () => (
  <Footer>
    <p>
      Created by <A href="https://twitter.com/saiemgilani">Saiem Gilani</A>
    </p>
  </Footer>
);

export default FooterComponent;
