// app/api/query.js

module.exports = function(db) {

	return {
		register: function(first, last, email, hash, callback) {
			db.query('INSERT INTO User (First, Last, Email, Password) VALUES (?,?,?,?)', [first, last, email, hash], callback);
		},

		getHash: function(email, callback) {
			db.query('SELECT Password FROM User u WHERE u.email = ?', [email], callback);
		},

		newMeeting: function(meetings, callback) {
			db.query('', meetings, callback);
		},

		getScope: function(user, callback) {
			db.query("(SELECT 'student' AS Role, NULL AS National, s.Chapter, o.Admin, o.Title FROM Student s LEFT JOIN Office o ON s.Email = ? AND o.Email = s.Email) " +
						"UNION " +
						"(SELECT 'advisor' AS Role, NULL AS National, a.Chapter, NULL AS Admin, NULL AS Title FROM Advisor a WHERE a.Email = ?) " +
						"UNION " +
						"(SELECT 'employee' AS Role, e.Nationals, NULL AS Chapter, NULL AS Admin, NULL AS Title FROM Employee e WHERE e.Email = ?) " +
						"UNION " +
						"(SELECT 'admin' AS Role, NULL AS National, NULL AS Chapter, NULL AS Admin, NULL AS Title FROM Admin a WHERE a.Email = ?)", 
						[user, user, user, user], callback);
		},

		getSubPositions: function(chapter, title, callback) {
			db.query('SELECT p.SubChapter Chapter, p.SubOffice Title FROM Permissions p WHERE p.HeadChapter = ? AND p.HeadOffice = ?', [chapter, title], callback);
		},

		addToken: function(token, user, expiration, callback) {
			db.query('INSERT INTO Token VALUES(?, ?, ?)' , [token, user, expiration], callback);
		}
	};
};