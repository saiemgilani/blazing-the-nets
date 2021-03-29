import React, { Component } from "react";
import "./DrawerToggleButton.css";
// import { HamburgerVortex } from 'react-animated-burgers';
import { HamburgerElastic } from 'react-animated-burgers';

class DrawerToggleButton extends Component {
    state = {
        isActive: false
    }

    static getDerivedStateFromProps(nextProps) {
        return {
            isActive: nextProps.isOpen,
        };
    }

    toggleButton = () => {
        this.setState({
            isActive: !this.state.isActive
        })
    }

    render() {
        return (
            <div onClick={this.props.click} className="toggle-button">
                <HamburgerElastic
                    isActive={this.state.isActive} 
                    toggleButton={this.toggleButton} 
                    barColor="#006BB6" />
            </div>
        );
    }
}


export default DrawerToggleButton;