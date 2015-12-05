// app/api/middleware.js

module.exports = function(app, pool) {

	var query = require('./query')(pool);
	var bcrypt = require('bcrypt');
	var moment = require('moment');
	var jwt = require('jsonwebtoken');
	var md5 = require('md5');

	moment().format();

	function register(req, res) {

		req.checkBody({
			'name.first' : {
				notEmpty: true,
				errorMessage: 'Must provide a first name'
			},
			'name.last' : {
				notEmpty: true,
				errorMessage: 'Must provide a last name'
			},
			'email' : {
				notEmpty: true,
				isEmail: {
					errorMessage: 'Invalid Email'
				}
			},
			'password' : {
				notEmpty: true,
				isLength: {
					options: [8],
					errorMessage: 'Mmust be at least 8 characters'
				},
				containsUpper: {
					errorMessage: 'Must contain at least one upper-case character'
				},
				containsLower: {
					errorMessage: 'Must contain at least one lower-case character'
				},
				containsSpecial: {
					errorMessage: 'Must contain at least one special character'
				},
				containsDigit: {
					errorMessage: 'Must contain at least one digit'
				},
				errorMessage : 'Invalid password'
			},
			'confirmation' : {
				equals: req.body.password,
				errorMessage : 'Confirmation must match password'
			}
		});

		var errors = req.validationErrors();

		if (errors) {
			return res.status(400).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			bcrypt.hash(req.body.password, 10, function(err, hash) {

				if (err) {
					res.status(500).json({
						success: false,
						message: 'Could not hash password',
						errors: err
					});
				} else {
					query.register(
					req.body.name.first,
					req.body.name.last,
					req.body.email,
					hash, function(err, result) {		
						if (err) {
							return res.status(200).json({
								success: false,
								message: 'Could not create user in database',
								errors: err
							});
						} else {
							genToken(req.body.email, function(scope, token) {
								return res.status(200).json({
									success: true,
									token: token
								});
							});
						}
					});
				}
			});
		}
	}

	function login(req, res) {
		var email = req.body.email;
		var password = req.body.password;

		if (email && password) {
			query.getHash(email, function(err, result) {
				if (err) {
					throw err;
				}
				if (!result[0]) {
					return res.status(400).json({
						success: false,
						message: 'Username or password was incorrect',
					});
				} else {
					bcrypt.compare(password, result[0].Password, function(err, bres) {
						if (err) {
							throw err;
						}
						if (!bres) {
							res.status(400).json({
								success: false,
								message: 'Username or password was incorrect'
							});
						} else {
							genToken(email, function(scope, token) {
								res.status(200).json({
									success: true,
									token: token
								});
							});
						}
					});
				}
			});

		}
	}

	function newMeeting(req, res) {

		req.checkBody('meetingDate', 'Date is invalid').isDate();
		req.checkBody('meetingTitle', 'Need a meeting title').notEmpty();
		req.checkBody('repeat', 'Option is invalid').matches(/^(none|daily|weekly|monthly)$/);
		req.checkBody('until', 'Date is invalid').isDate();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			var endingDate = moment(req.body.until);
			var meeting = {meetingTitle: req.body.meetingTitle, meetingDate: moment(req.body.meetingDate)};
			var meetings = [];

			while(meeting.meetingDate.isBefore(endingDate) || endingDate.isSame(meeting.meetingDate))
			{
				switch(req.bodyrepeat)
				{
					case 'none':
						meetings.push(meeting);
						break;
					case 'daily':
						meetings.push(meeting);
						meeting.add(1, 'd');
						break;
					case 'weekly':
						meetings.push(meeting);
						meeting.add(1, 'w');				
						break;
					case 'monthly':
						meetings.push(meeting);
						meeting.add(1, 'M');				
						break;
				}
			}


			meetings = meetings.map(function(obj) {
				return [req.body.chapter, obj.meetingTitle, obj.meetingDate.toDate()];
			});

			query.newMeeting(meetings, function(err, result) {
				if (err) {
					return res.status(500).json({
						success: false,
						message: 'Could not create meeting',
						errors: err
					});
				} else {
					return res.status(200).json({
						success: true,
						meetings: meetings
					});
				}
			});
		}
	}

	function genToken(user, callback) {
		query.getScope(user, function(err, result) {
			if (err) {
				throw err;
			} else {
				var scope = {};
				if (result[0]) {
					scope = {
						user: user,
						role: result[0].Role,
						chapter: result[0].Chapter,
						national: result[0].National,
						position: {
							title: result[0].Title,
							admin: result[0].Admin
						}
					};
					if (scope.position.title) {
						var subs = [];
						getSubPositions(result[0].Chapter, result[0].Title, subs, function() {
							scope.position.subs = subs;
							createAddToken(scope, user, callback);
						});						
					} else {
						createAddToken(scope, user, callback);
					}
				} else {
					scope = {
						user: user
					};
					createAddToken(scope, user, callback);
				}
			}
		});
	}

	function getSubPositions(chapter, title, subs, callback) {
		query.getSubPositions(chapter, title, function(err, result) {
			if (err) {
				throw err;
			}
			result.forEach(function(sub) {
				subs.push(sub);
				getSubPositions(chapter, sub.Title, subs, function() {
				});
			});
			callback();
		});
	}

	function createAddToken(scope, user, callback) {
		var token = jwt.sign(scope, app.get('jwtSecret'), {
			expiresIn: 604800 // expires in 7 days
		});
		query.addToken(md5(token), user, moment().add(604800, 's').toDate(), function(err, result) {
			if (err && err.code !== "ER_DUP_ENTRY") {
				throw err; 
			}
		});
		callback(scope, token);
	}

	function getUsers(req, res) {
		req.checkQuery('email', 'Not a valid email.').optional().isEmail();
		req.checkQuery('role', 'Not a valid string.').optional().isAlpha();
		req.checkQuery('chapID', 'Not an integer.').optional().isInt();
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();		

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			var email = req.body.email;
			var role = req.body.role;
			var chapID = req.body.chapID;
			var natName = req.body.natName;
			var searchString = req.body.searchString;
			var pageNumber = req.body.pageNumber;
			var pageSize = req.body.pageSize;

			if (role == 'student') {
				if(chapID) {
					query.getUserByStudentRoleChapter(pageNumber, pageSize, searchString, chapID, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});
				}
				else if (natName) {
					query.getUserByStudentRoleNational(pageNumber, pageSize, searchString, natName, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});					
				}
				else {
					query.getUserByStudentRole(pageNumber, pageSize, searchString, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});					
				}
			}
			else if (role == 'advisor') {
				if(chapID) {
					query.getUserByAdvisorRoleChapter(pageNumber, pageSize, searchString, chapID, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});
				}
				else if (natName) {
					query.getUserByAdvisorRoleNational(pageNumber, pageSize, searchString, natName, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});					
				}
				else {
					query.getUserByAdvisorRole(pageNumber, pageSize, searchString, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});					
				}
			}
			else if (role == 'admin') {
				query.getUserByAdvisorRole(pageNumber, pageSize, searchString, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						users: result
					});
				});					
			}
			else if (role == 'employee') {
				if (natName) {
					query.getUserByEmployeeRoleNational(pageNumber, pageSize, searchString, natName, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});					
				}
				else {
					query.getUserByEmployeeRole(pageNumber, pageSize, searchString, function(err, result) {
						if (err) {
							throw err;
						}
						return res.status(200).json({
							success: true,
							users: result
						});
					});					
				}
			}
			else if (chapID) {
				query.getUserByChapter(pageNumber, pageSize, searchString, chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						users: result
					});
				});					
			}	
			else if (natName) {
				query.getUserByNational(pageNumber, pageSize, searchString, natName, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						users: result
					});
				});					
			}
			else if (searchString) {
				query.getAllUsers(pageNumber, pageSize, searchString, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						users: result
					});
				});
			}									
		}		
	}


	function getChapters(req, res) {
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();
		req.checkQuery('email', 'Not an email.').optional().isEmail();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			var pageNumber = req.body.pageNumber;
			var pageSize = req.body.pageSize;
			var email = req.body.email;
			var searchString = req.body.searchString;
			var natName = req.body.natName;
			var chapID = req.body.chapID;

			if(chapID) {
				query.getChapterByID(chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapters: result
					});
				});
			} else if(natName) {
				query.getChapterByNational(pageNumber, pageSize, natName, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapters: result
					});
				});				
			} else if(email) {
				query.getChapterByUser(pageNumber, pageSize, email, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapters: result
					});
				});				
			} else if(searchString){
				query.getAllChapters(pageNumber, pageSize, searchString, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapters: result
					});
				});	
			}			
		}
	}

	function getNationals(req, res) {
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();
		req.checkQuery('email', 'Not an email.').optional().isEmail();		

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			var pageNumber = req.body.pageNumber;
			var pageSize = req.body.pageSize;
			var email = req.body.email;
			var searchString = req.body.searchString;
			var chapID = req.body.chapID;

			if(chapID) {
				query.getNationalByChapID(chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						nationals: result
					});
				});			
			} else if(email) {
				query.getNationalByUser(pageNumber, pageSize, email, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						nationals: result
					});
				});				
			} else if(searchString){
				query.getAllNationals(pageNumber, pageSize, searchString, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						nationals: result
					});
				});	
			}						
		}
	}

	//change first name, last name, email
	function editAccount(req, res) {
		req.checkBody('fname', 'Not a string.').isAlpha();
		req.checkBody('lname', 'Not a string.').isAlpha();
		req.checkBody('email', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
	}

	function removeAccount(req, res) {
		req.checkQuery('email', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var email = req.body.email;

			query.removeAccount(email, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					users: result
				});
			});
		}
	}

	function removeChapter(req, res) {
		req.checkQuery('chapID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var chapID = req.body.chapID;

			query.removeChapter(chapID, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					users: result
				});
			});
		}
	}

	function removeNational(req, res) {
		var natName = req.body.natName;

		query.removeNational(natName, function(err, result) {
			if (err) {
				throw err;
			}
			return res.status(200).json({
				success: true,
				users: result
			});
		});
	}	

	function removeMeeting(req, res) {
		req.checkQuery('mtgID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var mtgID = req.body.mtgID;

			query.removeMeeting(mtgID, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					users: result
				});
			});
		}
	}

	function removeReport(req, res) {
		req.checkQuery('reportID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var reportID = req.body.reportID;

			query.removeReport(reportID, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					users: result
				});
			});
		}
	}

	function removePosition(req, res) {
		req.checkQuery('chapID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var posTitle = req.body.posTitle;
			var chapID = req.body.chapID;

			query.removeReport(posTitle, chapID, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					users: result
				});
			});
		}
	}				

	function uploadImage(req, res) {
		//need to validate that the image is buffer data
	}

	function changePassword(req, res) {
		req.checkBody({
			'oldPassword' : {
				notEmpty: true,
				isLength: {
					options: [8],
					errorMessage: 'Mmust be at least 8 characters'
				},
				containsUpper: {
					errorMessage: 'Must contain at least one upper-case character'
				},
				containsLower: {
					errorMessage: 'Must contain at least one lower-case character'
				},
				containsSpecial: {
					errorMessage: 'Must contain at least one special character'
				},
				containsDigit: {
					errorMessage: 'Must contain at least one digit'
				},
				errorMessage : 'Invalid password'
			},
			'newPassword' : {
				notEmpty: true,
				isLength: {
					options: [8],
					errorMessage: 'Mmust be at least 8 characters'
				},
				containsUpper: {
					errorMessage: 'Must contain at least one upper-case character'
				},
				containsLower: {
					errorMessage: 'Must contain at least one lower-case character'
				},
				containsSpecial: {
					errorMessage: 'Must contain at least one special character'
				},
				containsDigit: {
					errorMessage: 'Must contain at least one digit'
				},
				errorMessage : 'Invalid password'
			},
			'confirmationPassword' : {
				notEmpty: true,
				isLength: {
					options: [8],
					errorMessage: 'Mmust be at least 8 characters'
				},
				containsUpper: {
					errorMessage: 'Must contain at least one upper-case character'
				},
				containsLower: {
					errorMessage: 'Must contain at least one lower-case character'
				},
				containsSpecial: {
					errorMessage: 'Must contain at least one special character'
				},
				containsDigit: {
					errorMessage: 'Must contain at least one digit'
				},
				errorMessage : 'Invalid password'
			}
		});

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
	}

	function inviteMember(req, res) {
		req.checkBody('email', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
	}

	function getInvitedMembers(req, res) {

	}

	function addPosition(req, res) {
		req.checkBody('admin', 'Not a boolean value.').isBoolean();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
	}

	function getPositions(req, res) {
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();
		req.checkQuery('email', 'Not an email.').optional().isEmail();		

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			var pageNumber = req.body.pageNumber;
			var pageSize = req.body.pageSize;
			var email = req.body.email;
			var chapID = req.body.chapID;
			var posTitle = req.body.posTitle;

			if(chapID) {
				query.getPositionsByChapter(pageNumber, pageSize, chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						positions: result
					});
				});			
			} else if(email) {
				query.getPositionByUser(email, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						positions: result
					});
				});				
			} else if(chapID && posTitle){
				query.getPositionByTitle(chapID, posTitle, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						positions: result
					});
				});	
			}						
		}
	}

	function removeFromChapter(req, res) {

	}

	function editChapter(req, res) {

	}

	function createNationalOrg(req, res) {

	}

	return {
		register: register,
		login: login,
		newMeeting: newMeeting,
		genToken: genToken,
		getSubPositions: getSubPositions,
		createAddToken: createAddToken,
		getUsers: getUsers,
		getChapters: getChapters,
		getNationals: getNationals,
		editAccount: editAccount,
		uploadImage: uploadImage,
		changePassword: changePassword,
		inviteMember: inviteMember,
		getInvitedMembers: getInvitedMembers,
		addPosition: addPosition,
		getPositions: getPositions,
		removeFromChapter: removeFromChapter,
		removePosition: removePosition,
		editChapter: editChapter,
		createNationalOrg: createNationalOrg
	};
};

