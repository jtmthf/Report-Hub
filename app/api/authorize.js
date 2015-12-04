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
						message: 'Not authorized to get users with current parameters'
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
							message: 'Not authorized to get users with current parameters'
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
				message: 'Not authorized to get users with current parameters'
			});
		}
	}

	function removeUser(req, res, next) {
		var permissions = req.permissions;

		if (permissions.role === 'admin') {
			next();
		} else if (req.body.email === permissions.user) {
			next();
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete user'
			});
		}
	}

	function removeChapter(req, res, next) {
		if (req.permissions.role === 'admin') {
			next();
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete chapter'
			});
		}
	}

	function removeNational(req, res, next) {
		if (req.permissions.role === 'admin') {
			next();
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete national'
			});
		}
	}

	function removeMeeting(req, res, next) {
		var permissions = req.permissions;

		if (permissions.role === 'admin') {
			next();
		} else if (permissions.role === 'advisor') {
			query.isAdvisorOfMeeting(permissions.user, req.body.meeting, function(err, result) {
				if (err) {
					throw err;
				}
				if (result[0]) {
					next();
				} else {
					res.status(403).json({
						success: false,
						token: req.token,
						message: 'Not authorized to remove meeting'
					});					
				}
			});
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to remove meeting'
			});
		}
	}

	function removeReport(req, res, next) {
		if (req.body.permissions === 'admin') {
			next();
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete chapter'
			});
		}
	}

	function removePosition(req, res, next) {
		if (req.body.permissions === 'admin') {
			next();
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete chapter'
			});
		}
	}


	return {
		newMeeting: newMeeting,
		getUsers: getUsers,
		removeUser: removeUser,
		removeChapter: removeChapter,
		removeNational: removeNational,
		removeMeeting: removeMeeting,
		removeReport: removeReport,
		removePosition: removePosition
	};
};