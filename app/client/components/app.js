var React = require('react');
import Navbar from 'react-bootstrap/lib/Navbar';
import Nav    from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import Welcome from './Welcome'

class App extends React.Component {

	constructor(props) {
		super(props);
		this.handleRegister = this.handleRegister.bind(this);
		this.handleLogin = this.handleLogin.bind(this);
		this.handleHome = this.handleHome.bind(this);
	}

	handleRegister() {
		this.props.history.pushState(null, '/register')
	}

	handleLogin() {
		this.props.history.pushState(null, '/login')
	}

	handleHome(event) {
		this.props.history.pushState(null, '/')
		event.stop
	}

	render() {
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
							<NavItem onClick={this.handleRegister}>Register</NavItem>
							<NavItem onClick={this.handleLogin}>Login</NavItem>
						</Nav>
					</Navbar.Collapse>
				</Navbar>
				<div> { this.props.children || <Welcome /> } </div>
			</div>
		);
	}
}

module.exports = App;