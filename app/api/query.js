// app/api/query.js

module.exports = function(db) {
	"use strict"

	return {
		//Registers user with the site by entering their first and last names, email, and password hash into the database system
		register: function(first, last, email, hash, callback) {
			db.query('INSERT INTO User (First, Last, Email, Password) VALUES (?,?,?,?)', [first, last, email, hash], callback);
		},

		//Gets the password hash of a user using their email
		getHash: function(email, callback) {
			db.query('SELECT Password FROM User u WHERE u.email = ?', [email], callback);
		},

		//Inserts array of meetings into meeting table
		newMeeting: function(meetings, callback) {
			db.query('', meetings, callback);
		},

		//Gets the permissions of each user
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

		//Gets the positions that a specified position has control over
		getSubPositions: function(chapter, title, callback) {
			db.query('SELECT p.SubChapter Chapter, p.SubOffice Title FROM Permissions p WHERE p.HeadChapter = ? AND p.HeadOffice = ?', [chapter, title], callback);
		},

		//Inserts into the Token table a token for the user
		addToken: function(token, user, expiration, callback) {
			db.query('INSERT INTO Token VALUES(?, ?, ?)' , [token, user, expiration], callback);
		},

		//Gets all the attributes of a chapter using the chapter ID
		getChapter: function(chapID, callback) {
			db.query('SELECT * FROM Chapter C WHERE C.ID = ?', [chapID], callback);
		},

		//Gets all the users that match up somehow with the searchString entered in by the website user
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getAllUsers: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U WHERE U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?% LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users within a chapter - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByChapter: function(pageNum, pageSize, searchString, chapID, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Student S WHERE U.Email = S.Email AND S.Chapter = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "students" - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByStudentRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Student S WHERE U.Email = S.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "admins" - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByAdminRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Admin A WHERE U.Email = A.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "employees" - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByEmployeeRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Employee E WHERE U.Email = E.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "advisors" - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByAdvisorRole: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Advisor A WHERE U.Email = A.Email AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},	

		//Gets all the users that are "students" within a specified chapter - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByStudentRoleChapter: function(pageNum, pageSize, searchString, chapID, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Student S, Chapter C WHERE U.Email = S.Email AND C.ID = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "advisors" for a specified chapter - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByAdvisorRoleChapter: function(pageNum, pageSize, searchString, chapID, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Advisor A WHERE U.Email = A.Email AND A.Chapter = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "students" of a specified National organizaiton - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByStudentRoleNational: function(pageNum, pageSize, searchString, natName, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Student S, Chapter C WHERE U.Email = S.Email AND S.Chapter = C.ID AND C.Nationals = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [natName, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "advisors" within a specified National organization - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByAdvisorRoleNational: function(pageNum, pageSize, searchString, natName, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Advisor A, Chapter C WHERE U.Email = A.Email AND A.Chapter = C.ID AND C.Nationals = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [natName, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the users that are "employees" within a specified National organization - can narrow down the users with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getUserByEmployeeRoleNational: function(pageNum, pageSize, searchString, natName, callback) {
			db.query('SELECT U.First, U.Last, U.Email, U.Avatar FROM User U, Employee E WHERE U.Email = E.Email AND E.Nationals = ? AND (U.First LIKE ?% OR U.Last LIKE ?% OR U.Email LIKE ?%) LIMIT ?, ?', [natName, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Removes a user from the database using their email
		removeUser: function(email, callback) {
			db.query('DELETE FROM User U WHERE U.Email = ?', [email], callback);
		},	

		//Removes an invited person from the database using their email
		removeInvite: function(email, callback) {
			db.query('DELETE FROM Invite I WHERE I.Email = ?', [email], callback);
		},	

		//Removes a chapter from the database using the chapter ID
		removeChapter: function(chapID, callback) {
			db.query('DELETE FROM Chapter C WHERE C.ID = ?', [chapID], callback);
		},

		//Removes a national organization from the database system using the national name
		removeNational: function(natName, callback) {
			db.query('DELETE FROM National N WHERE N.Name = ?', [natName], callback);
		},				

		//Removes a meeting from the database system using meeting ID
		removeMeeting: function(mtgID, callback) {
			db.query('DELETE FROM Meeting M WHERE M.ID = ?', [mtgID], callback);
		},

		//Removes a report from the database system using a reportID
		removeReport: function(reportID, callback) {
			db.query('DELETE FROM Report R WHERE R.ID = ?', [reportID], callback);
		},		

		//Removes a position from the database system using the position title and chapter ID
		removePosition: function(posTitle, chapID, callback) {
			db.query('DELETE FROM Office O WHERE O.Title = ? AND O.Chapter = ?', [posTitle, chapID], callback);
		},

		//Removes student from chapter, but does not remove that user from the database completely
		removeStudentFromChapter: function(chapID, email, callback) {
			db.query('DELETE FROM Student S WHERE S.Chapter = ? AND S.Email = ?', [chapID, email], callback);
		},

		//Removes advisor from chapter, but does not remove that user from the database completely
		removeAdvisorFromChapter: function(chapID, email, callback) {
			db.query('DELETE FROM Advisor A WHERE A.Chapter = ? AND A.Email = ?', [chapID, email], callback);
		},		

		//Gets all the chapters whose attributes match up with the specified searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getAllChapters: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT C.Name FROM Chapter C WHERE C.Name LIKE ?% OR C.SchoolName LIKE ?% OR C.Nationals LIKE ?% LIMIT ?, ?', [searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		}, 

		//Gets a chapter using its chapter ID
		getChapterByID: function(chapID, callback) {
			db.query('SELECT C.Name FROM Chapter C WHERE C.ID = ?', [chapID], callback);
		},	

		//Gets all the chapters within a specified National organization
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getChapterByNational: function(pageNum, pageSize, natName, callback) {
			db.query('SELECT C.Name FROM Chapter C WHERE C.Nationals = ? LIMIT ?, ?', [natName, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets the chapter of a user, who is specified by their email
		getChapterByUser: function(email, callback) {
			db.query("(SELECT C.Name FROM Chapter C, Advisor A WHERE C.ID = A.Chapter AND A.Email = ?)" +
					"UNION" +
					"(SELECT C.Name FROM Chapter C, Student S WHERE C.ID = S.Chapter AND S.Email = ?)",
					[email, email], callback);
		},

		//Gets all the national organizations whose attributes match up with a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getAllNationals: function(pageNum, pageSize, searchString, callback) {
			db.query('SELECT N.Name FROM National N WHERE N.Name LIKE ?% LIMIT ?, ?', [searchString, (pageNum-1)*pageSize, pageSize], callback);
		}, 

		//Gets the national organization of a chapter using the chapter ID
		getNationalByChapID: function(chapID, callback) {
			db.query('SELECT C.Nationals FROM Chapter C WHERE C.ID = ?', [chapID], callback);
		},

		//Gets the national organization of a user
		getNationalByUser: function(email, callback) {
			db.query("(SELECT C.Nationals FROM Chapter C, Advisor A,  WHERE C.ID = A.Chapter AND A.Email = ?)" +
					"UNION" +
					"(SELECT C.Nationals FROM Chapter C, Student S WHERE C.ID = S.Chapter AND S.Email = ?)" +
					"UNION" +
					"(SELECT E.Nationals FROM Employee E WHERE E.Email = ?)",
					[email, email, email], callback);
		},

		//Gets the positions within a chapter
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getPositionsByChapter: function(pageNum, pageSize, chapID, callback) {
			db.query('SELECT O.Title FROM Office O WHERE O.Chapter = ? LIMIT ?, ?', [chapID, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets the position that a user holds using the user's email
		getPositionByUser: function(email, callback) {
			db.query('SELECT O.Title FROM Office O WHERE O.Email LIKE ?%', [email], callback);
		},	

		//Gets a position of a chapter by its title
		getPositionByTitle: function(chapID, posTitle, callback) {
			db.query('SELECT O.Title FROM Office O WHERE O.Title LIKE ?% AND O.Chapter = ?', [posTitle, chapID], callback);
		},

		//Gets all the invites that have been sent out by a specified chapter - can be narrowed down using a searchString
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getInvitesByChapter: function(pageNum, pageSize, chapID, searchString, callback) {
			db.query('SELECT I.Email FROM Invite I WHERE I.Chapter = ? AND (I.Position LIKE ?% OR I.Nationals LIKE ?% OR I.Role LIKE ?% LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the meetings that happened on a certain date
		getMeetingByDay: function(mtgDay, callback) {
			db.query('SELECT M.Day FROM Meeting M WHERE M.Day = ?', [mtgDay], callback);
		},

		//Gets all the meetings that have been held by a chapter
		getMeetingByChapter: function(chapID, callback) {
			db.query('SELECT M.Day FROM Meeting M WHERE M.Chapter = ?', [chapID], callback);
		},	

		//Gets a meeting using its ID
		getMeetingByID: function(mtgID, callback)	{
			db.query('SELECT M.Day FROM Meeting M WHERE M.ID = ?', [mtgID], callback);
		},

		//Gets the reports of the officers within a specified chapter - can be narrowed down with a searchString
		//user can search by title of report, position of the person who wrote the report, or the text within the report
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getReportsByChapter: function(pageNum, pageSize, searchString, chapID, callback)	{
			db.query('SELECT R.Title FROM Report R WHERE R.Chapter = ? AND (R.Title LIKE ?% OR R.Office LIKE ?% or R.Html LIKE %?% LIMIT ?, ?', [chapID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);
		},

		//Gets all the reports made by a certain position
		getReportByPosition: function(posTitle, callback) {
			db.query('SELECT R.Title FROM Report R WHERE R.Office = ?' [posTitle], callback);
		},

		//Get all the reports within a meeting
		//PageNum and PageSize are used to determine how pages are loaded as the user scrolls downwards
		getReportsByMeeting: function(pageNum, pageSize, mtgID, searchString, callback)	{
			db.query('SELECT R.Title FROM Report R WHERE R.Meeting = ? AND (R.Title LIKE ?% OR R.Office LIKE ?% or R.Html LIKE %?% LIMIT ?, ?', [mtgID, searchString, searchString, searchString, (pageNum-1)*pageSize, pageSize], callback);			
		},

		//Get a report using its ID
		getReportByID: function(ID, callback) {
			db.query('SELECT R.Title FROM Report R WHERE R.ID = ?', [ID], callback);
		},

		//Edit a user's information (first name, last name, and email)
		//If one of these attributes has not changed, the old value will be passed in
		editUser: function(fname, lname, email, newEmail, callback) {
			db.query('UPDATE User SET First=?, Last=?, Email=? WHERE Email=?', [fname, lname, newEmail, email], callback);
		},

		//Insert new invitee into Invite table when a user wishes to invite a new chapter member to use the application
		inviteChapMember: function(email, chapID, role, posTitle, callback) {
			db.query('INSERT INTO Invite (Email, Chapter, Position, Role) VALUES (?, ?, ?, ?)', [email, chapID, posTitle, role], callback);
		},

		//Insert new invitee into Invite table when a user wishes to invite a new national employee to use the application
		inviteEmployee: function(email, natName, role, callback) {
			db.query('INSERT INTO Invite (Email, Nationals, Role) VALUES (?, ?, ?)', [email, natName, role], callback);
		},

		//Add a new position to the Office table
		addPosition: function(admin, title, chapID, email, callback) {
			db.query('INSERT INTO Office (Admin, Title, Chapter, Email) VALUES (?, ?, ?, ?)', [admin, title, chapID, email], callback);
		},

		//Edit the chapter name
		editChapterName: function(chapID, chapName, callback) {
			db.query('UPDATE Chapter SET Name=? WHERE ID=?', [chapName, chapID], callback);
		},

		//Edit the name of the school where the chapter is located
		editChapterSchoolName: function(chapID, school, callback) {
			db.query('UPDATE Chapter SET SchoolName=? WHERE ID=?', [school, chapID], callback);
		},

		//Create a new chapter
		createChapter: function(chapName, natName, schoolName, callback) {
			db.query('INSERT INTO Chapter (Name, Nationals, SchoolName) VALUES (?, ?, ?)', [chapName, natName, schoolName], callback);
		},

		//Create a new National organization
		createNational: function(natName, url, callback) {
			db.query('INSERT INTO National (Name, Url) VALUES (?, ?)', [natName, url], callback);
		},

		//Edit a National organization's name and/or url
		editNational: function(natName, newName, url, callback)	{
			db.query('UPDATE National SET Name=?, Url=? WHERE Name=?', [newName, url, natName], callback);
		},

		//Edit a meeting's date and/or title
		editMeeting: function(mtgID, day, title, callback)	{
			db.query('UPDATE Meeting SET Day=?, Title=? WHERE ID=?', [day, title, mtgID], callback);
		},

		//Edit a position's title, admin, and/or email
		editPosition: function(title, newTitle, admin, email, chapID, callback) {
			db.query('UPDATE Office SET Title=?, Admin=?, Email=? WHERE Title=? AND Chapter=?', [newTitle, admin, email, title, chapID], callback);
		},

		//Create a new report
		createReport: function(html, plain, created, meeting, office, chapter, callback) {
			db.query('INSERT INTO Report (Html, Plain, Created, Meeting, Office, Chapter) VALUES (?,?,?,?,?,?)', [html, plain, created, meeting, office, chapter], callback);
		},

		//Edit a report's information
		editReport: function(html, plain, edited, meeting, office, reportID, callback) {
			db.query('UPDATE Report SET Html=?, Plain=?, Edited=?, Office=?, Meeting=? WHERE ID=?', [html, plain, edited, meeting, office, reportID], callback);
		},					

		//Get all the entities within the token table for a specified user
		getTokens: function(email) {
			return db.query('SELECT * FROM Token T WHERE T.User = ?', [email]);
		}		
	};
};