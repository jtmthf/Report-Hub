var React = require('react');
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import Input from 'react-bootstrap/lib/Input'

class EditNational extends React.Component {

	constructor(props) {
		super(props);
		this.state = {newName: '', natName: '', url: '', nationals: null}
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleURLChange = this.handleURLChange.bind(this);
		this.handleNewNameChange = this.handleNewNameChange.bind(this);
		this.getNationals = this.getNationals.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.getNationals();
	}

	handleNewNameChange(event) {
		this.setState({newName: event.target.value});
	}

	handleURLChange(event) {
		this.setState({url: event.target.value});
	}

	handleNameChange(event) {
		this.setState({natName: event.target.value, newName: ''})
	}

	buildNationals(data) {
		let nationals = [];
		for (var value of data) {
			nationals.push(
				<option value={value.Name}>{value.Name}</option>
			);
		}
		this.setState({nationals: nationals, natName: data[0].Name});
	}	

	// GET api/national
	getNationals() {
		const token = sessionStorage.getItem('token');
		let headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			pageNumber: 1,
			pageSize: 100,
			searchString: ''
		}
		const that = this;

		//don't need contentType for get requests
		$.ajax({
			type: 'GET',
			url: 'https://localhost:8443/api/national',
			contentType: 'application/x-www-form-urlencoded; charset=utf-8',
			dataType: 'json',
			data: data,
			headers: headers
		}).done(function (data) {
			that.buildNationals(data.nationals);
		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('getNationals Failed!');
		});			
	}

	// PUT api/national
	handleSubmit() {
		const token = sessionStorage.getItem('token');
		let headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			url: this.state.url,
			name: this.state.natName,
			newName: this.state.newName
		}
		const that = this;

		//don't need contentType for get requests
		$.ajax({
			type: 'PUT',
			url: 'https://localhost:8443/api/national',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			data: JSON.stringify(data),
			headers: headers
		}).done(function (data) {

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('handleSubmit for EditNational Failed!');
		});			
	}

	// DELETE api/national
	handleDelete() {
		var token = sessionStorage.getItem(tokenKey);
		var headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			natName: this.state.natName
		}
		const that = this;

		//don't need contentType for get requests
		$.ajax({
			type: 'DELETE',
			url: 'https://localhost:8443/api/national',
			dataType: 'json',
			data: data,
			headers: headers
		}).done(function (data) {

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('handleDelete for national Failed!');
		});			
	}

	render() {
		return (
			<Modal {...this.props}>
				<Modal.Header closeButton>
					<Modal.Title>Edit National Organization</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<form>
						<Input 
							type="select"
							label="Pick National"
							placeholder="select..."
							value={this.state.natName}
							onChange={this.handleNameChange}>
								{this.state.nationals}
						</Input>
						<Input 
							type="text"
							value={this.state.newName}
							label="New Name:"
							onChange={this.handleNewNameChange} />
						<Input
							type="text"
							value={this.state.url}
							label="New URL:"
							onChange={this.handleURLChange} />
					</form>
				</Modal.Body>
				<Modal.Footer>
					<Button onClick={this.handleSubmit}>Edit</Button>
					<Button onClick={this.handleDelete}>Delete</Button>
					<Button onClick={this.props.onHide}>Close</Button>
				</Modal.Footer>
			</Modal>

		);
	}
}

module.exports = EditNational;