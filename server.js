// server.js

// modules =================================================
var express        = require('express');
expressValidator   = require('express-validator')
var app            = express();
var bodyParser     = require('body-parser');
var morgan		   = require('morgan');
var mysql		   = require('mysql');

var config         = require('./config');

// configuration ===========================================
var port = process.env.PORT || config.port;
var pool = mysql.createPool({
	connectionLimit : config.connectionLimit,
	database		: config.database,
	user 			: config.user,
	password 		: config.password
});
app.set('jwtSecret', config.jwtSecret);
var api = express.Router();

// get all data/stuff of the body (POST) parameters
// parse application/json 
app.use(bodyParser.json());
app.use(expressValidator({
	customValidators: {
		containsLower: function(value) {
			return /[a-z]/.test(value);
		},
		containsUpper: function(value) {
			return /[A-Z]/.test(value);
		},
		containsSpecial: function(value) {
			return /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/.test(value);
		},
		containsDigit: function(value) {
			return /[0-9]/.test(value);
		}
	}
}));

// use morgan to log requests to the console
app.use(morgan('dev')); 

// set the static files location eg. /public/img will be /img for users
app.use(express.static(__dirname + '/public')); 

// routes ==================================================
require('./routes')(app, api, pool); // configure our routes
app.use('/api', api)

// start app ===============================================
// startup our app at http://localhost:8080
app.listen(port);               

// shoutout to the user                     
console.log('Magic happens on port ' + port);

// expose app           
exports = module.exports = app;  