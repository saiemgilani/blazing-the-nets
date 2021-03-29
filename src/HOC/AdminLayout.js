import React from 'react';
import AdminNav from '../Components/Admin/Nav';

import './adminlayout.css';

const AdminLayout = (props) => {
    return (
        <div className="admin_container">
            <div className="admin_left_nav">
                <AdminNav/>
            </div>

            <div className="admin_right">
                {props.children}
            </div>
        </div>
    );
};

export default AdminLayout;