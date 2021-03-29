import React from "react";
import { Link } from 'react-router-dom';
import DrawerToggleButton from "../SideDrawer/DrawerToggleButton";
import Button from '@material-ui/core/Button';

import styled from 'styled-components';
import "./Toolbar.css";

const Toolbar = props => {
  return (
  <header className="toolbar">
    <div className="toolbar-wrapper">
      <nav className="toolbar__navigation">
        <div className="spacer" />
        <div className="toolbar_navigation-header">
          <h1>Blazing the Nets</h1>
        </div>
        <div className="toolbar_navigation-items">
          <ul>
            <Link to='/'>
              <Button color='inherit'>Home</Button>
            </Link>
            <Link to='/teams'>
              <Button color='inherit'>Teams</Button>
            </Link>
            <Link to='/players'>
              <Button color='inherit'>Players</Button>
            </Link>

            {/* {
              !props.user ? (
                <Link to='/login'>
                  <Button color='inherit'>Login</Button>
                </Link>
              ) : (
                <Link to='/dashboard'>
                  <Button color='inherit'>Dashboard</Button>
                </Link>
              )
            } */}
          </ul>
        </div>
        <div className="toolbar__toggle-button">
          <DrawerToggleButton isOpen={props.isOpen} click={props.drawerClickHandler} />
        </div>
      </nav>
    </div>
  </header>
)};

export default Toolbar;
