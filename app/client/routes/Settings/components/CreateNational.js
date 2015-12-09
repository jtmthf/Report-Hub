var React = require('react');

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
			sessionStorage.setItem('token', data.token);
			that.props.history.pushState(null, '/app');
		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('Register Failed!');
		});			
	}

	render() {
		return (
			<div></div>
		);
	}
}

module.exports = CreateNational;