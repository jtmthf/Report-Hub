// app/api/authorize.js

module.exports = function(pool) {

	var query = require('./query')(pool);

	function newMeeting(req, res, next) {
		var permissions = req.permissions;

		if (permissions.role === 'admin') {
			next();
		} else if (permissions.role === 'student' && permissions.chapter == req.body.chapter && permissions.position.admin) {
			next();
		} else if (permissions.role === 'advisor' && permissions.chapter == req.body.chapter) {
			next();
		} else if (permissions.role === 'employee') {
			query.getChapter(req.body.chapter, function(err, result) {
				if (err) {
					throw err;
				}
				if (result[0].Nationals === permissions.national) {
					next();
				} 
			});
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to create meeting'
			});
		}
	}

	function getUsers(req, res, next) {
		var permissions = req.permissions;

		if (permissions.role === 'admin') {
			next();
		} else if (permissions.role === 'employee' && (req.body.role === 'employee' || req.body.role === 'advisor' || req.body.role === 'student' || !req.body.role)) {
			if (req.body.national) {
				if (req.body.national === permissions.national) {
					next();
				} else {
					res.status(403).json({
						success: false,
						token: req.token,
						message: 'Not authorized to create meeting'
					});
				}
			} else if (req.body.chapter) {
				query.getChapter(req.body.chapter, function(err, result) {
					if (err) {
						throw err;
					}
					if (result[0].Nationals === permissions.national) {
						next();
					} else {
						res.status(403).json({
							success: false,
							token: req.token,
							message: 'Not authorized to create meeting'
						});
					}
				});
			} else {
				next();
			}
		} else if (permissions.role === 'student' && permissions.role === 'advisor' && (req.body.role === 'advisor' || req.body.role === 'student' || !req.body.role)) {
			if (req.body.chapter) {
				if (req.body.chapter === permissions.chapter) {
					next();
				}
			} else if (!req.body.national) {
				next();
			}
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to create meeting'
			});
		}
	}

	return {
		newMeeting: newMeeting,
		getUsers: getUsers
	};
};