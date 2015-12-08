var React = require('react');
import Grid from 'react-bootstrap/lib/Grid';
import Col from 'react-bootstrap/lib/Col';
import Panel from 'react-bootstrap/lib/Panel';
import Row from 'react-bootstrap/lib/Row';
import Input from 'react-bootstrap/lib/Input';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';

class Register extends React.Component {

	constructor(props) {
		super(props);
		this.state = {first: '', last: '', email: '', password: '', confirmation: ''};
		this.handleFirstChange = this.handleFirstChange.bind(this);
		this.handleLastChange = this.handleLastChange.bind(this);
		this.handleEmailChange= this.handleEmailChange.bind(this);
		this.handlePasswordChange = this.handlePasswordChange.bind(this);
		this.handleConfirmationChange = this.handleConfirmationChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleFirstChange(event) {
		this.setState({first: event.target.value});
	}

	handleLastChange(event) {
		this.setState({last: event.target.value});
	}

	handleEmailChange(event) {
		this.setState({email: event.target.value});
	}

	handlePasswordChange(event) {
		this.setState({password: event.target.value});
	}

	handleConfirmationChange(event) {
		this.setState({confirmation: event.target.value});		
	}

	handleSubmit() {
		let data = {
			name: {
				first: this.state.first,
				last: this.state.last
			},
			email: this.state.email,
			password: this.state.password,
			confirmation: this.state.confirmation
		}
		let that = this;

		$.ajax({
			type: 'POST',
			url: 'https://localhost:8443/api/register',
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
				<Col xs={12} md={8} mdOffset={2}>
					<Grid fluid={true}>
						<Panel>
							<Row>
								<h1 className="text-center" style={{fontFamily: "mohave"}}>Register:</h1>
							</Row>
							<form>
								<Row>
									<Col xs={12} md={6}>
										<Input
											type="text"
											value={this.state.first}
											label="First Name:" 
											onChange={this.handleFirstChange} />
									</Col>
									<Col xs={12} md={6}>
										<Input
											type="text"
											value={this.state.last}
											label="Last Name:"
											onChange={this.handleLastChange} />
									</Col>									
								</Row>
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
										<Input
											type="password"
											value={this.state.confirmation}
											label="Re-enter Password:"
											onChange={this.handleConfirmationChange} />
									</Col>
								</Row>
								<Row>
									<Col xs={12} className="text-center" style={{fontFamily: "mohave"}}>
										<ButtonInput value="REGISTER" bsSize="large" onClick={this.handleSubmit}/>
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

module.exports = Register;
