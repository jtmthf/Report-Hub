var React = require('react');
import Grid from 'react-bootstrap/lib/Grid';
import Col from 'react-bootstrap/lib/Col';
import Panel from 'react-bootstrap/lib/Panel';
import Row from 'react-bootstrap/lib/Row';
import PageHeader from 'react-bootstrap/lib/PageHeader';
import Input from 'react-bootstrap/lib/Input';
import ButtonInput from 'react-bootstrap/lib/ButtonInput';

class Register extends React.Component {

	constructor(props) {
		super(props);
		this.state = {first: '', last: '', email: '', password: '', confirmation: ''};
	}

	render() {
		return (
			<Grid>
				<Col xs={12} md={8}>
					<Grid fluid={true}>
						<Panel>
							<Row>
								<PageHeader>Register:</PageHeader>
							</Row>
							<form>
								<Row>
									<Col xs={12} md={6}>
										<Input
											type="text"
											value={this.state.first}
											label="First Name:" />
									</Col>
									<Col xs={12} md={6}>
										<Input
											type="text"
											value={this.state.last}
											label="Last Name:" />
									</Col>									
								</Row>
								<Row>
									<Col xs={12}>
										<Input
											type="text"
											value={this.state.email}
											label="Email Address:" />
									</Col>
								</Row>
								<Row>
									<Col xs={12}>
										<Input
											type="text"
											value={this.state.password}
											label="Password:" />
									</Col>								
								</Row>
								<Row>
									<Col xs={12}>
										<Input
											type="text"
											value={this.state.confirmation}
											label="Re-enter Password:" />
									</Col>
								</Row>
								<Row>
									
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
