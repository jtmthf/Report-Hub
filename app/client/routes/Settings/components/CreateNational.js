var React = require('react');
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import Input from 'react-bootstrap/lib/Input'

class CreateNational extends React.Component {

	constructor(props) {
		super(props);
	}

	// POST api/national
	handleSubmit() {
		var token = sessionStorage.getItem(tokenKey);
		var headers = {};
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
					<h4>Here we go!</h4>
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