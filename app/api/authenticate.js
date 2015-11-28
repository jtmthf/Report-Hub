// app/api/authenticate.js

var jwt = require('jsonwebtoken');

module.exports = function(app) {
	function authenticate(req, res, next) {
		var token = req.body.token;
		if (token) {
			jwt.verify(token, app.get('jwtSecret'), function(err, decoded) {
				if (err) {
					return res.status(403).json({ success: false, message: 'Failed to authenticate token.'});
				} else {
					req.permissions = decoded;
					next();
				}
			});
		} else {
			return res.status(403).send({
				success: false,
				message: 'No token provided.'
			});
		}
	}

	return {
		authenticate: authenticate
	};
};