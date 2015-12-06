// server.js

// modules =================================================
var fs             		= require('fs');
var path                = require('path')
var https 		   		= require('https');
var express 			= require('express');
var expressValidator   	= require('express-validator')
var bodyParser     		= require('body-parser');
var morgan		   		= require('morgan');
var mysql		   		= require('mysql');
var multer 				= require('multer');

var app           	 	= express();
var upload 		 		= multer();


var config         		= require('./config');

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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressValidator({
	customValidators: {
		containsLower: function(value) {
			"use strict"
			return /[a-z]/.test(value);
		},
		containsUpper: function(value) {
			"use strict"
			return /[A-Z]/.test(value);
		},
		containsSpecial: function(value) {
			"use strict"
			return /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/.test(value);
		},
		containsDigit: function(value) {
			"use strict"
			return /[0-9]/.test(value);
		}
	}
}));

// use morgan to log requests to the console
app.use(morgan('dev')); 

// routes ==================================================
require('./routes')(app, api, pool, upload); // configure our routes
app.use('/api', api)

// set the static files location eg. /public/img will be /img for users
app.use(express.static(__dirname + '/public')); 

app.get('*', function (req, res){
	"use strict"
	res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
});


// start app ===============================================
// startup our app at http://localhost:8080
https.createServer({
    key: fs.readFileSync('dist/debug/key.pem'),
    cert: fs.readFileSync('dist/debug/cert.pem')
}, app).listen(port);

// expose app           
exports = module.exports = app;  