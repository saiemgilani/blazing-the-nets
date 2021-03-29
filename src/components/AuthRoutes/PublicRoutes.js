import React from 'react';
import { Route, Redirect } from 'react-router-dom';

const PublicRoutes = ({
    user,
    component: Comp,
    ...rest
}) => {
    return <Route {...rest} component={(props) => (
        rest.restricted ?
            (user ? // if user is authenticated, prevent him for going to login page
                    <Redirect to="/dashboard"/>
                :
                    <Comp {...props} user={user}/> 
            )
        : <Comp {...props} user={user}/> 
    )}/>
};

export default PublicRoutes;