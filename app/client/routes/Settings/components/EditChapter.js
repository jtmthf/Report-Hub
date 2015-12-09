var React = require('react');

class EditChapter extends React.Component {

	constructor(props) {
		super(props);
	}

	// GET api/chapter
	getChapter() {
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
			natName: this.state.natName,
			chapID: this.state.chapID
		}
		const that = this;

		$.ajax({
			type: 'GET',
			url: 'https://localhost:8443/api/chapter',
			dataType: 'json',
			data: data,
			headers: headers
		}).done(function (data) {

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('getChapter Failed!');
		});			
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

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('getNationals Failed!');
		});			
	}

	// PUT api/chapter
	handleSubmit() {
		var token = sessionStorage.getItem(tokenKey);
		var headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			removeStudent: this.state.removeStudent,
			removeAdvisor: this.state.removeAdvisor,
			chapID: this.state.chapID,
			chapName: this.state.chapName,
			school: this.state.school
		}
		const that = this;

		$.ajax({
			type: 'PUT',
			url: 'https://localhost:8443/api/chapter',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			data: JSON.stringify(data),
			headers: headers
		}).done(function (data) {

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('handleSubmit for EditChapter Failed!');
		});			
	}

	// DELETE api/chapter
	handleDelete() {
		var token = sessionStorage.getItem(tokenKey);
		var headers = {};
		if (token) {
		    headers.Authorization = 'Bearer ' + token;
		}

		const data = {
			chapID: this.state.chapID
		}
		const that = this;

		$.ajax({
			type: 'DELETE',
			url: 'https://localhost:8443/api/chapter',
			dataType: 'json',
			data: data,
			headers: headers
		}).done(function (data) {

		}).fail( function (jqXHR, textStatus, errorThrown) {
			alert('handleDelete for chapter Failed!');
		});	
	}


	render() {
		return (
			<div></div>
		);
	}
}

module.exports = EditChapter;