import React from 'react'
import { ButtonToolbar, Button, ToggleButtonGroup, ToggleButton, Navbar,NavItem, Nav,NavDropdown } from 'react-bootstrap'
import { BrowserRouter, Link,NavLink } from 'react-router-dom'
import { LinkContainer } from 'react-router-bootstrap'
import Container from 'react-bootstrap/Container'



class Navigation extends React.Component {
    render() {
        return (
            // <div>
            
                // <Container>
            <BrowserRouter>
                <div className="header-bar">
                    {/* <Navbar bg="#495464"  fixed="top" expand="xl"> */}
                    <Navbar style={{}} bg="dark" variant="dark" fixed="top" expand="xl">
                        
                        {/* <Navbar.Toggle aria-controls="basic-navbar-nav" className="ml-auto hidden-sm-up float-xs-left" /> */}
                            {/* <Navbar.Collapse id="basic-navbar-nav"> */}
                                <Nav className="mr-auto" fill="true" variant="pills" style={{"list-style": "none",      display: "flex", justifyContent:"space-between"   }}>
                                    {/* <Nav className="mr-auto" fill="true" variant="pills"> */}

                                    <NavLink to="/"         style={{ color: 'lightgrey',"text-decoration": "none" ,fontSize:24}}>
                                        Home
                                    </NavLink>

                                    <NavLink to='/compare'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        Compare
                                    </NavLink>

                                    {/* <NavLink to='/bubble'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        Modular
                                    </NavLink> */}

                                    
                                    <NavLink to='/scatter'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        Scatter
                                    </NavLink>

                                    {/* <NavLink to='/test'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        Test
                                    </NavLink>

                                    <NavLink to="/slider"   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        Slider
                                    </NavLink>


                                    <NavLink to='/my'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        ShotChart
                                    </NavLink>

                                    <NavLink to='/shotchart'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        ShotChartOld
                                    </NavLink>
                                    */}
                                    <NavLink to='/table'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                         Table
                                    </NavLink> 

                                    {/* <NavLink to='/template'   style={{ color: 'lightgrey',"text-decoration": "none","margin-left":"15px", fontSize:24 }}>
                                        Template
                                    </NavLink>
   */}





                                    {/* <Link to='/table'>Table</Link>
                                    <Link to='/bubble'>Modular</Link>
                                    <Link to='/test'>test</Link>
                                    <Link to='/slider'>Slider</Link>
                                    <Link to='/scatter'>Scatter</Link>
                                    <Link to='/shotchart'>Shotchart</Link>
                                    <Link to='/my'>My Shotchart</Link>
                                    
                                    <Link to='/grid'>Grid</Link> */}






                                    

                                    {/* <NavDropdown title="Dropdown" id="basic-nav-dropdown" style={{ color: 'grey',"text-decoration": "none","margin-left":"20px" }}>
                                        <NavDropdown.Item href="/test">Action</NavDropdown.Item>
                                        <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                                        <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                                        <NavDropdown.Divider />
                                        <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                                    </NavDropdown> */}
                                </Nav>
                            {/* </Navbar.Collapse> */}
                    </Navbar>
                </div>
                </BrowserRouter>    
            // </Container>
            // </div>
        )
    }
}

export default Navigation;