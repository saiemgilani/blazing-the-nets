import React from "react";

import "./SideDrawer.css";

const SideDrawer = props => {
  let drawerClasses = "side-drawer";

  if (props.show) {
    drawerClasses = "side-drawer open";
  }

  return (
    <nav className={drawerClasses}>
      <ul>
        <li>
          <a className="btn ripple" href="/">Home</a>
        </li>
        <li>
          <a className="btn ripple" href="/teams">Teams</a>
        </li>
        <li>
          <a className="btn ripple" href="/players">Players</a>
        </li>

        {
          !props.user ? (
            <li>
              <a className="btn ripple" href="/login">Login</a>
            </li>
          ) : (
            <li>
              <a className="btn ripple" href="/dashboard">Dashboard</a>
            </li>
            )
        }
      </ul>
    </nav>
  );
};

export default SideDrawer;