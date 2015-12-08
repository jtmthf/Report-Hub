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
		this.handleEmailChange= this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);

	}

	handleEmailChange(event) {
		this.setState({email: event.target.value});
	}

	handlePasswordChange(event) {
		this.setState({password: event.target.value});
	}

	handleSubmit() {
		let data = {
			email: this.state.email,
			password: this.state.password
		}
		let that = this;

		$.ajax({
			type: 'POST',
			url: 'https://localhost:8443/api/login',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			data: JSON.stringify(data)
		}).done(function (data) {
			sessionStorage.setItem('token', data.token);
			that.props.history.pushState(null, '/app');
		}).fail( function (jqXHR, textStatus, errorThrown) {

		});
	}	

	render() {
		return (
			<Grid>
				<Col xs={10} xsOffset={1} md={4} mdOffset={4}>
					<Grid fluid={true}>
						<Panel>
							<Row>
								<h1 className="text-center" style={{fontFamily: "mohave"}}>Login:</h1>
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
									<Col xs={12} className="text-center" style={{fontFamily: "mohave"}}>
										<ButtonInput value="LOGIN" bsSize="large" onClick={this.handleSubmit}/>
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