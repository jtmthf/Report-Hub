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
}

function new_meeting(db, title, mtg_date, repeat, until)
{

	var ending_date = moment(until);
	var meeting = {mtg_title: title, meeting_date: moment(mtg_date)};
	var meetings = [];

	while(meeting.meeting_date.isBefore(ending_date) || ending_date.isSame(meeting.meeting_date))
	{
		switch(repeat)
		{
			case "none":
				meetings.push(meeting);
				break;
			case "daily":
				meetings.push(meeting);
				meeting.add(1, 'd');
				break;
			case "weekly":
				meetings.push(meeting);
				meeting.add(1, 'w');				
				break;
			case: "monthly":
				meetings.push(meeting);
				meeting.add(1, 'M');				
				break;
			default: 
				return false;
		}
	}

	for(i = 0; i < meetings.length; i++)
	{
		meetings[i].meeting_date = meetings[i].meeting_date.toDate();
	}

	//db.query('INSERT INTO MEETING VALUES(?, ?, ?, ?)', []

	return true;
}