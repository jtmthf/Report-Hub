var React = require('react');
import Grid from 'react-bootstrap/lib/Grid';
import Col from 'react-bootstrap/lib/Col';
import Panel from 'react-bootstrap/lib/Panel';
import Row from 'react-bootstrap/lib/Row';
import Input from 'react-bootstrap/lib/Input';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';

class Login extends React.Component {

	constructor(props) {
		super(props);
		this.state = {email: '', password: ''};
	}

	handleEmailChange(event) {
		this.setState({email: event.target.value});
	}

	handlePasswordChange(event) {
		this.setState({password: event.target.value});
	}

	render() {
		return (
			<Grid>
				<Col xs={10} xsOffset={1} md={4} mdOffset={4}>
					<Grid fluid={true}>
						<Panel>
							<Row>
								<h1>Login:</h1>
							</Row>
							<form>
								<Row>
									<Col xs={12}>
										<Input
											type="text"
											value={this.state.email}
											label="Email Address:"
											onChange={this.handleEmailChange} />
									</Col>
								</Row>
								<Row>
									<Col xs={12}>
										<Input
											type="password"
											value={this.state.password}
											label="Password:" 
											onChange={this.handlePasswordChange} />
									</Col>								
								</Row>
								<Row>
									<Col xs={12}>
										<ButtonInput type="submit" value="LOGIN" bsSize="large" />
									</Col>
								</Row>								
							</form>
						</Panel>
					</Grid>
				</Col>
			</Grid>
		);
	}
}

module.exports = Login;