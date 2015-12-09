var React = require('react');

class CreateChapter extends React.Component {

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

		$.ajax({
			type: 'GET',
			url: 'https://localhost:8443/api/national',
			dataType: 'json',
			data: data,
			headers: headers
		}).done(function (data) {
			sessionStorage.setItem('token', data.token);
			that.props.history.pushState(null, '/app');
		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('Register Failed!');
		});			
	}

	// POST api/chapter
	handleSubmit() {
		var token = sessionStorage.getItem(tokenKey);
		var headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			chapName: this.state.chapName,
			natName: this.state.natName,
			schoolName: this.state.schoolName
		}
		const that = this;

		$.ajax({
			type: 'POST',
			url: 'https://localhost:8443/api/chapter',
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

module.exports = CreateChapter;