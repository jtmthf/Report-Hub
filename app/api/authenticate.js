// app/api/authenticate.js

module.exports = function(app, pool) {
	"use strict"

	var jwt = require('jsonwebtoken');
	var redis = require('redis');
	var md5 = require('md5');
	var middleware   = require('./middleware.js')(app, pool);

	var client = redis.createClient(); //creates a new client

	function authenticate(req, res, next) {
		var token = req.headers.Authorization.replace('Bearer ', '');
		if (token) {
			jwt.verify(token, app.get('jwtSecret'), function(err, decoded) {
				if (err) {
					return res.status(400).json({ 
						success: false, 
						message: 'Failed to authenticate token.'
					});
				} else {
					client.get(md5(token), function(err, reply) {
						if (err) {
							throw err;
						}
						if (reply === 'logout') {
							return res.status(400).json({ 
								success: false, 
								message: 'Failed to authenticate token.'
							});
						} else if (reply === 'rescope') {
							middleware.genToken(decoded.user, function(scope, token) {
								req.permissions = scope;
								res.token = token;
								next();
							});	
						} else {
							req.permissions = decoded;
							next();
						}
					});
				}
			});
		} else {
			return res.status(400).json({
				success: false,
				message: 'No token provided.'
			});
		}
	}

	function authURL(req, res, next) {
		req.headers.Authorization = req.body.token;
		authenticate(req, res, next);
	}

	return {
		authenticate: authenticate,
		authURL: authURL
	};
};
