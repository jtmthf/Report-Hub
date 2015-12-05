// app/api/authorize.js

module.exports = function(pool) {

	var query = require('./query')(pool);

	function createMeeting(req, res, next) {
		controlsChapter(req, res, next, function() {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to create meeting'
			});
		});
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
					if (result[0] && result[0].Nationals === permissions.national) {
						next();
					} else {
						res.status(403).json({
							success: false,
							token: req.token,
							message: 'Not authorized to get users with current parameters'
						});
					}
				});
			} else if (req.body.email) {
				query.isUserInNational(req.body.email, permissions.national, function(err, result) {
					if (err) {
						throw err;
					}
					if (result[0]) {
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
			} else if (req.body.email) {
				query.isUserInChapter(req.body.email, permissions.chapter, function(err, result) {
					if (err) {
						throw err;
					}
					if (result[0]) {
						next();
					} else {
						res.status(403).json({
							success: false,
							token: req.token,
							message: 'Not authorized to get users with current parameters'
						});						
					}
				});
			} else if (!req.body.national) {
				next();
			} else {
				res.status(403).json({
					success: false,
					token: req.token,
					message: 'Not authorized to get users with current parameters'
				});				
			}
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to get users with current parameters'
			});
		}
	}

	function editUser(req, res, next) {
		isSelfOrAdmin(req, res, next, function() {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to edit user'
			});			
		});
	}

	function removeUser(req, res, next) {
		isSelfOrAdmin(req, res, next, function() {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete user'
			});			
		});	
	}

	function getChapters(req, res, next) {
		isOfChapter(req, res, next, function() {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete user'
			});						
		});
	}

	function createChapter(req, res, next) {
		if (req.permissions.role === 'admin') {
			next();
		} else {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to create chapter'
			});
		}
	}

	function editChapter(req, res, next) {
		controlsChapter(req, res, next, function() {
			res.status(403).json({
				success: false,
				token: req.token,
				message: 'Not authorized to delete chapter'
			});
		});	
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

	function getNationals(req, res, next) {
		next();
	}

	function createNational(req, res, next) {
		next();
	}

	function editNational(req, res, next) {
		next();
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

	function getMeetings(req, res, next) {
		next();
	}

	function createMeeting(req, res, next) {
		next();
	}

	function editMeeting(req, res, next) {
		next();
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

	function getReports(req, res, next) {
		next();
	}

	function createReport(req, res, next) {
		next();
	}

	function editReport(req, res, next) {
		next();
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

	function getPositions(req, res, next) {
		next();
	}

	function createPosition(req, res, next) {
		next();
	}

	function editPosition(req, res, next) {
		next();
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

	function isSelfOrAdmin(req, res, next, callback) {
		var permissions = req.permissions;
		if (permissions.role === 'admin') {
			next();
		} else if (req.body.email === permissions.user) {
			next();
		} else {
			callback();
		}
	}

	function controlsChapter(req, res, next, callback) {
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
				if (result[0] && result[0].Nationals === permissions.national) {
					next();
				} 
			});
		} else {
			callback();
		}
	}

	function isOfChapter(req, res, next, callback) {
		var permissions = req.permissions;
		if (permissions.role === 'admin') {
			next();
		} else if (permissions.role === 'student' && permissions.chapter == req.body.chapter) {
			next();
		} else if (permissions.role === 'advisor' && permissions.chapter == req.body.chapter) {
			next();
		} else if (permissions.role === 'employee') {
			query.getChapter(req.body.chapter, function(err, result) {
				if (err) {
					throw err;
				}
				if (result[0] && result[0].Nationals === permissions.national) {
					next();
				} 
			});
		} else {
			callback();
		}
	}

	return {
		getUsers: getUsers,					//done
		editUser: editUser,					//done
		removeUser: removeUser,				//done
		getChapters: getChapters,			//done
		createChapter: createChapter,		//done
		editChapter: editChapter,			//done
		removeChapter: removeChapter,		//done
		getNationals: getNationals,
		createNational: createNational,
		editNational: editNational,
		createMeeting: createMeeting,		//done
		removeNational: removeNational,		//done
		getMeetings: getMeetings,
		createMeeting: createMeeting,
		editMeeting: editMeeting,
		removeMeeting: removeMeeting,
		getReports: getReports,
		createReport: createReport,
		editReport: editReport,
		removeReport: removeReport,
		getPositions: getPositions,
		createPosition: createPosition,
		editPosition: editPosition,
		removePosition: removePosition
	};
};
