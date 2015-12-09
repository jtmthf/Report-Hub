var React = require('react');
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import Input from 'react-bootstrap/lib/Input'

class CreateNational extends React.Component {

	constructor(props) {
		super(props);
		this.state = {natName: '', url: ''}
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleURLChange = this.handleURLChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleNameChange(event) {
		this.setState({natName: event.target.value});
	}

	handleURLChange(event) {
		this.setState({url: event.target.value});
	}

	// POST api/national
	handleSubmit() {
		const token = sessionStorage.getItem('token');
		let headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			url: this.state.url,
			natName: this.state.natName
		}
		const that = this;

		$.ajax({
			type: 'POST',
			url: 'https://localhost:8443/api/national',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			data: JSON.stringify(data),
			headers: headers
		}).done(function (data) {

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('handleSubmit for CreateNational Failed!');
		});			
	}

	render() {
		return (
			<Modal {...this.props}>
				<Modal.Header closeButton>
					<Modal.Title>Create National Organization</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<form>
						<Input 
							type="text"
							value={this.state.natName}
							label="Name:"
							onChange={this.handleNameChange} />
						<Input
							type="text"
							value={this.state.url}
							label="URL:"
							onChange={this.handleURLChange} />
					</form>
				</Modal.Body>
				<Modal.Footer>
					<Button onClick={this.handleSubmit}>Create</Button>
					<Button onClick={this.props.onHide}>Close</Button>
				</Modal.Footer>
			</Modal>
		);
	}
}

module.exports = CreateNational;