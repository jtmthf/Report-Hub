var should = require('should');
var assert = require('assert');
var request = require('supertest');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('API', function() {

	describe('User', function() {
		var token = null;

		describe('Register', function() {
			it('should return error trying to register without first or last name', function(done) {
				var profile = {
				    name : {
				    },
				    email : "test@example.com",
				    password : "Mypass1!"
				};

				request('https://localhost:8443/api/register')
					.post('')
					.send(profile)
					.end(function(err, res) {
						if (err) {
							throw err;
						}

						res.status.should.be.equal(400);
						res.body.should.have.property('errors', [
						    {
						      	param: "name.first",
						      	msg: "Must provide a first name"
						    },
						    {
						      	param: "name.last",
						      	msg: "Must provide a last name"
						    }
						]);
						done();
				});
			});

			it('should return error for invalid email', function(done) {
				var profile = {
				    name : {
				    	first : "First",
				    	last : "Last"
				    },
				    email : "testexample.com",
				    password : "Mypass1!"
				};

				request('https://localhost:8443/api/register')
					.post('')
					.send(profile)
					.end(function(err, res) {
						if (err) {
							throw err;
						}

						res.status.should.be.equal(400);
						res.body.should.have.property('errors', [
						    {
						      	param: "email",
						      	msg: "Invalid Email",
						      	value: "testexample.com"
						    }
						]);
						done();
				});
			});

			it('should return error for invalid password', function(done) {
				var profile = {
				    name : {
				    	first : "First",
				    	last : "Last"
				    },
				    email : "test@example.com",
				    password : "password"
				};

				request('https://localhost:8443/api/register')
					.post('')
					.send(profile)
					.end(function(err, res) {
						if (err) {
							throw err;
						}

						res.status.should.be.equal(400);
						res.body.should.have.property('errors', [
						    {
						      	param: "password",
						      	msg: "Must contain at least one upper-case character",
						      	value: "password"
						    },
						    {
						      	param: "password",
						      	msg: "Must contain at least one special character",
						      	value: "password"
						    },
						    {
						      	param: "password",
						      	msg: "Must contain at least one digit",
						      	value: "password"
						    }					
						]);
						done();
				});
			});

			it('should successfully create an account', function(done) {
				var profile = {
				    name : {
				    	first : "First",
				    	last : "Last"
				    },
				    email : "test@example.com",
				    password : "Mypass1!"
				};

				request('https://localhost:8443/api/register')
					.post('')
					.send(profile)
					.end(function(err, res) {
						if (err) {
							throw err;
						}

						res.status.should.be.equal(200);
						res.body.should.have.property('success', true);
						res.body.should.have.property('token');
						token = res.body.token;
						done();
				});
			});
		});

		describe('Login', function() {

			var check = function(done) {
				if (token) done();
				else setTimeout(function() {check(done)}, 100);
			}

			before(function(done) {
				check(done);
			});

			it('should return error trying to login with incorrect email', function(done) {
				var profile = {
				    email : "test1@example.com",
				    password : "Mypass1!"
				};

				request('https://localhost:8443/api/login')
					.post('')
					.send(profile)
					.end(function(err, res) {
						if (err) {
							throw err;
						}

						res.status.should.be.equal(400);
						res.body.should.have.property('message', "Username or password was incorrect");				
						done();
				});
			});			

			it('should return error trying to login with incorrect password', function(done) {
				var profile = {
				    email : "test@example.com",
				    password : "Mypass1!2"
				};

				request('https://localhost:8443/api/login')
					.post('')
					.send(profile)
					.end(function(err, res) {
						if (err) {
							throw err;
						}

						res.status.should.be.equal(400);
						res.body.should.have.property('message', "Username or password was incorrect");				
						done();
				});
			});

			it('should successfully login', function(done) {
				var profile = {
				    email : "test@example.com",
				    password : "Mypass1!"
				};

				request('https://localhost:8443/api/login')
					.post('')
					.send(profile)
					.end(function(err, res) {
						if (err) {
							throw err;
						}

						res.status.should.be.equal(200);
						res.body.should.have.property('success', true);
						res.body.should.have.property('token');
						done();
				});
			});

		});
	});	
});
