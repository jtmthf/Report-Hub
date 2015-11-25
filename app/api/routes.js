// app/api/routes.js

module.exports = function(app, api, pool) {

    var auth0        = require('./authenticate.js')(app);
    var auth1        = require('./authorize.js');
    var middleware   = require('./middleware.js');

	// server routes ===========================================================
    // handle things like api calls
    // authentication routes

    api.post('/register', function(req, res) {
        middleware.register(req, res, pool);
    });

    api.post('/login', function(req, res) {
        middleware.login(req, res, pool);
    });
}