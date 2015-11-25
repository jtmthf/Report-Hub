// app/api/middleware.js

module.exports = function() {


	register: function(req, res, pool) {
		var first = req.body.first;
		var last = req.body.last;
		var email = req.body.email;
		var password = req.body.password;
		var confirmation = req.body.confirmation;

		confirmEmail(email)
	}

	login: function(req, res, pool) {

	}
}