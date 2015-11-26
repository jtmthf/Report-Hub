// app/api/query.js

module.exports = function(db) {

	register: function(first, last, email, hash, callback) {
		db.query('INSERT INTO User (First, Last, Email, Password) VALUES (?,?,?,?)', [first, last, email, hash], callback);
	}

	getHash: function(email, callback) {
		db.query('SELECT Password FROM User u WHERE u.email = ?', [email], callback);
	}
}