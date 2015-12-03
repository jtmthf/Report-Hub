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
		},

		getChapter: function(chapID, callback) {
			db.query('SELECT * FROM Chapter C WHERE C.ID = ?', [chapID], callback);
		},

		getAllUsers: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U WHERE U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?% LIMIT ?, ?', [searchString, searchString, searchString, pageNum, pageSize], callback);
		},

		getUserByChapter: function(pageNum, pageSize, searchString, chapID, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Chapter C WHERE C.ID = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByNational: function(pageNum, pageSize, searchString, natName, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, National N WHERE N.Name = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [natName, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByStudentRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Student S WHERE U.Email = S.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByAdminRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Admin A WHERE U.Email = A.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByEmployeeRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Employee E WHERE U.Email = E.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByAdvisorRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Advisor A WHERE U.Email = A.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},	

		getUserByStudentRoleChapter: function(pageNum, pageSize, searchString, chapID, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Student S, Chapter C WHERE U.Email = S.Email AND C.ID = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByAdvisorRoleChapter: function(pageNum, pageSize, searchString, chapID, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Advisor A, Chapter C WHERE U.Email = A.Email AND C.ID = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByStudentRoleNational: function(pageNum, pageSize, searchString, natName, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Student S, National N WHERE U.Email = S.Email AND N.Name = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [natName, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByAdvisorRoleNational: function(pageNum, pageSize, searchString, natName, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Advisor A, National N WHERE U.Email = A.Email AND N.Name = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [natName, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		getUserByEmployeeRoleNational: function(pageNum, pageSize, searchString, natName, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Employee E, National N WHERE U.Email = E.Email AND N.Name = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [natName, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		removeAccount: function(email, callback) {
			db.query('DELETE FROM User U WHERE U.Email = ?', [email], callback);
		}			

	};
};