var React = require('react');

class EditNational extends React.Component {

	constructor(props) {
		super(props);
	}

	// GET api/national
	getNationals() {
		var token = sessionStorage.getItem(tokenKey);
		var headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			pageNumber: this.state.pageNumber,
			pageSize: this.state.pageSize,
			email: this.state.email,
			searchString: this.state.searchString,
			chapID: this.state.chapID
		}
		const that = this;

		//don't need contentType for get requests
		$.ajax({
			type: 'GET',
			url: 'https://localhost:8443/api/national',
			dataType: 'json',
			data: data,
			headers: headers
		}).done(function (data) {

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('getNationals Failed!');
		});			
	}

	// PUT api/national
	handleSubmit() {
		var token = sessionStorage.getItem(tokenKey);
		var headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			url: this.state.url,
			name: this.state.name,
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
			<div></div>
		);
	}
}

module.exports = EditNational;