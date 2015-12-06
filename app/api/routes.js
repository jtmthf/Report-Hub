// app/api/routes.js

module.exports = function(app, api, pool, upload) {

    var auth0        = require('./authenticate.js')(app, pool);
    var auth1        = require('./authorize.js')(pool);
    var middleware   = require('./middleware.js')(app, pool);

	// server routes ===========================================================
    // handle things like api calls
    // authentication routes

    api.post('/register', middleware.register);

    api.post('/login', middleware.login);

    api.post('/password', auth0.authenticate, middleware.changePassword);

    api.post('profile', auth0.authURL, auth1.uploadAvatar, upload.single, middleware.uploadAvatar);

    api.post('/meeting', auth0.authenticate, auth1.newMeeting, middleware.newMeeting);

    api.get('/meeting', auth0.authenticate, auth1.getMeetings, middleware.getMeetings);

    api.put('/meeting', auth0.authenticate, auth1.editMeeting, middleware.editMeeting);

    api.delete('/meeting', auth0.authenticate, auth1.removeMeeting, middleware.removeMeeting);

    api.get('/national', auth0.authenticate, auth1.getNationals, middleware.getNationals);

    api.post('/national', auth0.authenticate, auth1.createNational, middleware.createNational);

    api.put('/national', auth0.authenticate, auth1.editNational, middleware.editNational);

    api.delete('/national', auth0.authenticate, auth1.removeNational, middleware.removeNational);

    api.get('/chapter', auth0.authenticate, auth1.getChapters, middleware.getChapters);

    api.post('/chapter', auth0.authenticate, auth1.createChapter, middleware.createChapter);

    api.put('/chapter', auth0.authenticate, auth1.editChapter, middleware.editChapter);

    api.delete('/chapter', auth0.authenticate, auth1.removeChapter, middleware.removeChapter);

    api.get('/user', auth0.authenticate, auth1.getUsers, middleware.getUsers);

    api.put('/user', auth0.authenticate, auth1.editUser, middleware.editUser);

    api.delete('/user', auth0.authenticate, auth1.removeUser, middleware.removeUser);

    api.get('/position', auth0.authenticate, auth1.getPositions, middleware.getPositions);

    api.post('/position', auth0.authenticate, auth1.addPosition, middleware.addPosition);

    api.put('/position', auth0.authenticate, auth1.editPosition, middleware.editPosition);

    api.delete('/position', auth0.authenticate, auth1.removePosition, middleware.removePosition);

    api.get('/report', auth0.authenticate, auth1.getReports, middleware.getReports);

    api.post('/report', auth0.authenticate, auth1.createReport, middleware.createReport);

    api.put('/report', auth0.authenticate, auth1.editReport, middleware.editReport);

    api.delete('/report', auth0.authenticate, auth1.removeReport, middleware.removeReport);
 
    api.get('/invite', auth0.authenticate, auth1.getInvitedMembers, middleware.getInvitedMembers);

    api.post('/invite', auth0.authenticate, auth1.inviteMember, middleware.inviteMember);

    api.delete('/invite', auth0.authenticate, auth1.removeInvite, middleware.removeInvite);


};