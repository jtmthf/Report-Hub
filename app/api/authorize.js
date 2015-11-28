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
			query.nationalsOfChapter(req.body.chapter, function(err, result) {
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

	return {
		newMeeting: newMeeting
	};
};