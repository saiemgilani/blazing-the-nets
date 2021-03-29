import React from 'react';
import Navbar from '../containers/Navbar/Navbar';
import Footer from '../containers/Footer';

const Layout = (props) => {
    return (
        <div> 
            <Navbar user={props.user}/>
                {props.children}
            <Footer/>
        </div>
    );
};

export default Layout;