var React = require('react');
import Navbar from 'react-bootstrap/lib/Navbar';
import Nav    from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';
import Welcome from './Welcome'

class AppNav extends React.Component {

	constructor(props) {
		super(props);
		this.handleRegister = this.handleRegister.bind(this);
		this.handleLogin = this.handleLogin.bind(this);
		this.handleHome = this.handleHome.bind(this);
		this.handleSettings = this.handleSettings.bind(this);
		this.handleLogout = this.handleLogout.bind(this);
	}

	handleRegister() {
		this.props.history.pushState(null, '/register')
	}

	handleLogin() {
		this.props.history.pushState(null, '/login')
	}

	handleHome() {
		this.props.history.pushState(null, '/')
	}

	handleSettings() {
		this.props.history.pushState(null, 'settings')
	}

	handleLogout() {
		sessionStorage.removeItem('token');
		this.props.history.pushState(null, '/')
	}

	buildRightNav() {
		const token = sessionStorage.getItem('token');
		if (token !== null) {
			return this.buildLoggedInRightNav(token);
		} else {
			return this.buildLoggedOutRightNav();
		}
	}

	buildLoggedInRightNav(token) {
		const scope = JSON.parse(atob(token.substring(token.indexOf('.')+1, token.lastIndexOf('.'))));

		return (
			<NavDropdown title={'Hello ' + scope.user}>
				<MenuItem onSelect={this.handleSettings}>Settings</MenuItem>
				<MenuItem onSelect={this.handleLogout}>Logout</MenuItem>
			</NavDropdown>
		);
	}

	buildLoggedOutRightNav() {
		return (
			<Navbar.Form>
				<ButtonInput onClick={this.handleRegister}>Register</ButtonInput>
				<ButtonInput onClick={this.handleLogin}>Login</ButtonInput>
			</Navbar.Form>
		);
	}

	render() {
		const rightNavItems = this.buildRightNav();

		return (
			<div>
				<Navbar fluid>
					<Navbar.Header>
						<Navbar.Brand>
							<span>
								<a href="#" onClick={this.handleHome}>
									<img src="img/logo.png" height="40" alt="Report Hub" />
								</a>
							</span>
						</Navbar.Brand>
						<Navbar.Toggle />
					</Navbar.Header>
					<Navbar.Collapse>
						<Nav pullRight>
							{rightNavItems}
						</Nav>
					</Navbar.Collapse>
				</Navbar>
				<div> { this.props.children || <Welcome /> } </div>
			</div>
		);
	}
}

module.exports = AppNav;