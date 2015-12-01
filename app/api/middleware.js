// app/api/middleware.js

module.exports = function(app, pool) {

	var query = require('./query')(pool);
	var bcrypt = require('bcrypt');
	var moment = require('moment');
	var jwt = require('jsonwebtoken');
	var md5 = require('md5');

	moment().format();

	function register(req, res) {

		req.checkBody({
			'name.first' : {
				notEmpty: true,
				errorMessage: 'Must provide a first name'
			},
			'name.last' : {
				notEmpty: true,
				errorMessage: 'Must provide a last name'
			},
			'email' : {
				notEmpty: true,
				isEmail: {
					errorMessage: 'Invalid Email'
				}
			},
			'password' : {
				notEmpty: true,
				isLength: {
					options: [8],
					errorMessage: 'Mmust be at least 8 characters'
				},
				containsUpper: {
					errorMessage: 'Must contain at least one upper-case character'
				},
				containsLower: {
					errorMessage: 'Must contain at least one lower-case character'
				},
				containsSpecial: {
					errorMessage: 'Must contain at least one special character'
				},
				containsDigit: {
					errorMessage: 'Must contain at least one digit'
				},
				errorMessage : 'Invalid password'
			},
			'confirmation' : {
				equals: req.body.password,
				errorMessage : 'Confirmation must match password'
			}
		});

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			bcrypt.hash(req.body.password, 10, function(err, hash) {

				if (err) {
					res.status(500).json({
						success: false,
						message: 'Could not hash password',
						errors: err
					});
				} else {
					query.register(
					req.body.name.first,
					req.body.name.last,
					req.body.email,
					hash, function(err, result) {		
						if (err) {
							return res.status(200).json({
								success: false,
								message: 'Could not create user in database',
								errors: err
							});
						} else {
							genToken(req.body.email, function(scope, token) {
								return res.status(200).json({
									success: true,
									token: token
								});
							});
						}
					});
				}
			});
		}
	}

	function login(req, res) {
		var email = req.body.email;
		var password = req.body.password;

		if (email && password) {
			query.getHash(email, function(err, result) {
				if (err) {
					return res.status(403).json({
						success: false,
						message: 'Could not find user',
						errors: err
					});
				} else {
					bcrypt.compare(password, result[0].Password, function(err, bres) {
						if (err) {
							throw err;
						} else if (!bres) {
							res.status(403).json({
								success: false,
								message: 'Password was incorrect'
							});
						} else {
							genToken(email, function(scope, token) {
								res.status(200).json({
									success: true,
									token: token
								});
							});
						}
					});
				}
			});

		}
	}

	function newMeeting(req, res) {

		req.checkBody('meetingDate', 'Date is invalid').isDate();
		req.checkBody('meetingTitle', 'Need a meeting title').notEmpty();
		req.checkBody('repeat', 'Option is invalid').matches(/^(none|daily|weekly|monthly)$/);
		req.checkBody('until', 'Date is invalid').isDate();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			var endingDate = moment(req.body.until);
			var meeting = {meetingTitle: req.body.meetingTitle, meetingDate: moment(req.body.meetingDate)};
			var meetings = [];

			while(meeting.meetingDate.isBefore(endingDate) || endingDate.isSame(meeting.meetingDate))
			{
				switch(req.bodyrepeat)
				{
					case 'none':
						meetings.push(meeting);
						break;
					case 'daily':
						meetings.push(meeting);
						meeting.add(1, 'd');
						break;
					case 'weekly':
						meetings.push(meeting);
						meeting.add(1, 'w');				
						break;
					case 'monthly':
						meetings.push(meeting);
						meeting.add(1, 'M');				
						break;
				}
			}


			meetings = meetings.map(function(obj) {
				return [req.body.chapter, obj.meetingTitle, obj.meetingDate.toDate()];
			});

			query.newMeeting(meetings, function(err, result) {
				if (err) {
					return res.status(500).json({
						success: false,
						message: 'Could not create meeting',
						errors: err
					});
				} else {
					return res.status(200).json({
						success: true,
						meetings: meetings
					});
				}
			});
		}
	}

	function genToken(user, callback) {
		query.getScope(user, function(err, result) {
			if (err) {
				throw err;
			} else {
				var scope = {};
				if (result[0]) {
					scope = {
						user: user,
						role: result[0].Role,
						chapter: result[0].Chapter,
						national: result[0].National,
						position: {
							title: result[0].Title,
							admin: result[0].Admin
						}
					};
					if (scope.position.title) {
						var subs = [];
						getSubPositions(result[0].Chapter, result[0].Title, subs, function() {
							scope.position.subs = subs;
							createAddToken(scope, user, callback);
						});						
					} else {
						createAddToken(scope, user, callback);
					}
				} else {
					scope = {
						user: user
					};
					createAddToken(scope, user, callback);
				}
			}
		});
	}

	function getSubPositions(chapter, title, subs, callback) {
		query.getSubPositions(chapter, title, function(err, result) {
			if (err) {
				throw err;
			}
			result.forEach(function(sub) {
				subs.push(sub);
				getSubPositions(chapter, sub.Title, subs, function() {
				});
			});
			callback();
		});
	}

	function createAddToken(scope, user, callback) {
		var token = jwt.sign(scope, app.get('jwtSecret'), {
			expiresIn: 604800 // expires in 7 days
		});
		query.addToken(md5(token), user, moment().add(604800, 's').toDate(), function(err, result) {
			if (err && err.code !== "ER_DUP_ENTRY") {
				throw err; 
			}
		});
		callback(scope, token);
	}

	return {
		register: register,
		login: login,
		newMeeting: newMeeting,
		genToken: genToken
	};
};

