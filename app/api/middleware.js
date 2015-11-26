// app/api/middleware.js

module.exports = function(app, pool) {

	var query = require('query')(pool);
	var bcrypt = require('bcrypt');
	var moment = require('moment');
	moment().format();

	register: function(req, res) {

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
				equals: req.body.password
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
							return res.json({
								success: false,
								message: 'Could not create user in database',
								errors: err
							});
						} else {
							return login(req, res, pool);
						}
					});
				}
			});
		}
	}

	login: function(req, res) {
		var email = req.body.email;
		var password = req.body.password;

		if (email && password) {
			query.getHash(email, function(err, result) {
				if (err) {
					return res.json({
						success: false,
						message: 'Could not find user',
						errors: err
					});
				} else {
					bcrypt.compare(password, result[0].Password, function(err, res) {
						if (err) {
							return res.status(500).json({
								success: false,
								message: 'Could not hash password',
								errors: err
							});
						} else if (!res) {
							return res.status(403).json({
								success: false,
								message: 'Password was incorrect'
							});
						} else {
							var token = jwt.sign(email, app.get('jwtSecret'), {
								expiresInMinutes: 10080 // expires in 7 days
							});

							return res.json({
								success: true,
								token: token
							});
						}
					});
				}
			});

		}
	}

	newMeeting: function(req, res) {

		req.checkBody('meetingDate', 'Date is invalid').isDate();
		req.checkBody('meetingTitle', 'Need a meeting title').notEmpty();
		req.checkBody('repeat', 'Option is invalid').optional().matches(/^(none|daily|weekly|monthly)$/);
		req.checkBody('until', 'Date is invalid').optional.isDate();

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
					case: 'monthly':
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
					return res.json({
						success: false,
						message: 'Could not find user',
						errors: err
					});
				} else {
					return res.json({
						success: true,
						meetings: meetings
					});
				}
			});
		}
	}
}
