// app/routes.js

module.exports = function(app, pool) {

	// server routes ===========================================================
    // handle things like api calls
    // authentication routes

    // sample api route
    app.get('/api/user', function(req, res) {
    	// Query to get all users in the database
    	pool.query('SELECT Email, Avatar, First, Last FROM User', function(err, rows, fields) {

    		// if there is an error retrieving, send the error.

    		if (err) {
    			res.send(err);
    		}

    		res.json(rows);
    	})
    })
}