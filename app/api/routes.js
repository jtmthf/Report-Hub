// app/api/routes.js

module.exports = function(app, api, pool) {

    var auth0        = require('./authenticate.js')(app, pool);
    var auth1        = require('./authorize.js')(pool);
    var middleware   = require('./middleware.js')(app, pool);

	// server routes ===========================================================
    // handle things like api calls
    // authentication routes

    api.post('/register', middleware.register);

    api.post('/login', middleware.login);

    api.post('/newMeeting', auth0.authenticate, auth1.newMeeting, middleware.newMeeting);

    api.get('/user', auth0.authenticate, auth1.getUsers, middleware.getUsers);
};