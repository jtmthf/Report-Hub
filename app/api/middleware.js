// app/api/middleware.js

module.exports = function(app, pool) {
	"use strict"

	var query = require('./query')(pool);
	var bcrypt = require('bcrypt');
	var moment = require('moment');
	var jwt = require('jsonwebtoken');
	var md5 = require('md5');
	var redis = require('redis');
	var easyimage = require('easyimage');
	var sanitizeHtml = require('sanitize-html');

	moment().format();
	var client = redis.createClient();

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
			}
		});

		var errors = req.validationErrors();

		if (errors || req.body.password != req.body.confirmation) {
			return res.status(400).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			bcrypt.hash(req.body.password, 10, function(err, hash) {

				if (err) {
					//throw err
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
					hash, function(err) {		
						if (err) {
							//throw err
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
						message: 'Username or password was incorrect'
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

	function changePassword(req, res) {
		req.checkBody({
			'newPassword' : {
				notEmpty: true,
				isLength: {
					options: [8],
					errorMessage: 'Must be at least 8 characters'
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
				equals: req.body.newPassword,
				errorMessage : 'Confirmation must match password'
			},
			'oldPassword' : {
				notEmpty: true,
				errorMessage: 'Must include current password'
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
			query.getHash(req.permissions.email, function(err, result) {
				if (err) {
					throw err;
				}
				if (!result[0]) {
					return res.status(400).json({
						success: false,
						message: 'Could not find user account'
					});
				} else {
					bcrypt.compare(req.body.oldPassword, result[0].Password, function(err, bres) {
						if (err) {
							throw err;
						}
						if (!bres) {
							res.status(400).json({
								success: false,
								message: 'Old password was incorrect'
							});
						} else {
							bcrypt.hash(req.body.newPassword, 10, function(err, hash) {
								if (err) {
									throw err;
								}
								query.updatePassword(req.body.email, hash, function(err) {		
									if (err) {
										throw err;
									}
									logoutToken(req.body.email, function() {
										genToken(req.body.email, function(scope, token) {
											return res.status(200).json({
												success: true,
												token: token
											});
										});
									});									
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

			query.newMeeting(meetings, function(err) {
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
		query.addToken(md5(token), user, moment().add(604800, 's').toDate(), function(err) {
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

			// TODO add get user by email, or scrap it by using the search string instead
			// if scrapped remove email checking from authorize
			//  var email = req.body.email;
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
			else {
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
			} else {
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
			} else {
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

	function editUser(req, res) {
		req.checkBody('fname', 'Not a string.').isAlpha();
		req.checkBody('lname', 'Not a string.').isAlpha();
		req.checkBody('email', 'Not an email.').isEmail();
		req.checkBody('newEmail', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}else {
			var fname = req.body.fname;
			var lname = req.body.lname;
			var email = req.body.email;
			var newEmail = req.body.newEmail;

			query.editUser(fname, lname, email, newEmail, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					user: result
				});
			});
			rescopeToken(newEmail);					
		}
	}

	function removeUser(req, res) {
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

			query.removeUser(email, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					user: result
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
					chapter: result
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
				national: result
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
					meeting: result
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
					report: result
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
					position: result
				});
			});
		}
	}				

	//needs email and role (student, advisor, etc.) always
	//If role is student or advisor, chapter must also be included
	//If role is employee, national must be included
	//If role is student, posTitle may be optionally included

	function inviteMember(req, res) {
		req.checkBody('email', 'Not an email.').isEmail();

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
			var posTitle = req.body.posTitle;

			if(email && chapID && (role == 'student' || role == 'advisor')) {
				query.inviteChapMember(email, chapID, role, posTitle, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						invite: result
					});
				});				
			} else if (role == 'employee' && email && natName) {
				query.inviteEmployee(email, natName, role, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						invite: result
					});
				});	
			}
		}
	}

	function getInvitedMembers(req, res) {

		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var pageNumber = req.body.pageNumber;
			var pageSize = req.body.pageSize;
			var searchString = req.body.searchString;
			var chapID = req.body.chapID;

			query.getInvitesByChapter(pageNumber, pageSize, chapID, searchString, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					invite: result
				});
			});
		}
	}

	function removeInvite(req, res) {
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

			query.removeInvite(email, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					invite: result
				});
			});
		}
	}	

	function addPosition(req, res) {
		req.checkBody('admin', 'Not a boolean value.').isBoolean();
		req.checkBody('email', 'Not an email.').optional().isEmail();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			var admin = req.body.admin;
			var title = req.body.title;
			var chapID = req.body.chapID;
			var email = req.body.email;

			query.addPosition(admin, title, chapID, email, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					position: result
				});
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

	function editChapter(req, res) {
		req.checkBody('removeUser', 'Not an email.').optional().isEmail();		

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			var removeUser = req.body.removeUser;
			var chapID = req.body.chapID;
			var chapName = req.body.chapName;
			var school = req.body.school;

			if(removeUser) {
				query.removeUserFromChapter(chapID, removeUser, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapter: result
					});
				});	
			} if(chapName) {
				query.editChapterName(chapID, chapName, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapter: result
					});
				});
			} if(school) {
				query.editChapterSchoolName(chapID, school, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapter: result
					});
				});				
			}			
		}	

	}

	function getMeetings(req, res) {
		req.checkQuery('mtgDay', 'Not a valid date.').optional().isDate();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			var chapID = req.body.chapID;
			var mtgDay = req.body.mtgDay;
			var mtgID = req.body.mtgID;

			if(chapID) {
				query.getMeetingByChapter(chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						meeting: result
					});
				});
			} else if(mtgDay) {
				query.getMeetingByDay(mtgDay, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						meeting: result
					});
				});				
			} else if(mtgID) {
				query.getMeetingByID(mtgID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						meeting: result
					});
				});				
			}			
		}
	}	

	function getReports(req, res) {
		req.checkQuery('mtgID', 'Not an integer.').optional().isInt();
		req.checkQuery('reportID', 'Not an integer.').optional().isInt();
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

			var chapID = req.body.chapID;
			var mtgID = req.body.mtgID;
			var searchString = req.body.searchString;
			var pageNumber = req.body.pageNumber;
			var pageSize = req.body.pageSize;
			var reportID = req.body.reportID;
			var posTitle = req.body.posTitle;

			if(chapID) {
				query.getReportsByChapter(pageNumber, pageSize, searchString, chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						report: result
					});
				});
			} else if(posTitle) {
				query.getReportByPosition(posTitle, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						report: result
					});
				});				
			} else if(mtgID) {
				query.getReportsByMeeting(pageNumber, pageSize, mtgID, searchString, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						report: result
					});
				});				
			} else if (reportID) {
				query.getReportByID(reportID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						report: result
					});
				});				
			}			
		}
	}

	function createChapter(req, res) {
		var chapName = req.body.chapName;
		var natName = req.body.natName;
		var schoolName = req.body.schoolName;

		query.createChapter(chapName, natName, schoolName, function(err, result) {
			if (err) {
				throw err;
			}
			return res.status(200).json({
				success: true,
				chapter: result
			});
		});
	}	

	//set url and name
	function createNational(req, res) {
		req.checkBody('url', 'Not a valid URL.').optional().isURL();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			var url = req.body.url;
			var natName = req.body.natName;

			query.createNational(natName, url, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					national: result
				});
			});
		}
	}		

	function createReport(req, res) {
		// required fields Meeting, Office, Chapter
		// optional Html
		var plain = '';
		sanitizeHtml(req.body.html, {
			textFilter: function(text) {
				plain += ' ' + text;
			}
		});

		query.createReport(req.body.html, plain, Date(), req.body.meeting, req.body.office, req.body.chapter, function(err) {
			if (err) {
				throw err;
			}
			return res.status(200).json({
				success: true
			});
		});
	}		

	function editReport(req, res) {
		req.checkBody('reportID', 'Need ID of report').notEmpty().isInt();
		var plain = '';
		sanitizeHtml(req.body.html, {
			textFilter: function(text) {
				plain += ' ' + text;
			}
		});

		query.editReport(req.body.html, plain, Date(), req.body.meeting, req.body.office, req.body.reportID, function(err) {
			if (err) {
				throw err;
			}
			return res.status(200).json({
				success: true
			});
		});
	}	

	function editNational(req, res) {
		req.checkBody('url', 'Not a valid URL.').notEmpty().isURL();
		req.checkBody('name', 'Should not be empty.').notEmpty();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}else {
			var url = req.body.url;
			var name = req.body.name;
			var newName = req.body.newName;

			if(newName) {
				query.editNational(name, newName, url, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						national: result
					});
				});				
			} else {
				query.editNational(name, name, url, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						national: result
					});
				});
			}
				
		}
	}

	//edit day, title - assume both are included and edit both of them automatically
	function editMeeting(req, res) {
		req.checkBody('day', 'Not a valid URL.').notEmpty().isDate();
		req.checkBody('title', 'Should not be empty.').notEmpty();
		req.checkBody('mtgID', 'Not an integer.').notEmpty().isInt();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}else {
			var day = req.body.day;
			var title = req.body.title;
			var mtgID = req.body.mtgID;

			query.editMeeting(mtgID, day, title, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					meeting: result
				});
			});				
				
		}
	}

	function editPosition(req, res) {
		req.checkBody('email', 'Not a valid email.').isEmail();
		req.checkBody('title', 'Should not be empty.').notEmpty();
		req.checkBody('admin', 'Not an integer.').notEmpty().isInt();
		req.checkBody('chapID', 'Not an integer.').notEmpty().isInt();

		var errors = req.validationErrors();

		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}else {
			var email = req.body.email;
			var title = req.body.title;
			var admin = req.body.admin;
			var chapID = req.body.chapID;
			var newTitle = req.body.newTitle;

			if(newTitle) {
				query.editPosition(title, newTitle, admin, email, chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						position: result
					});
				});					
			} else {
				query.editPosition(title, title, admin, email, chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						position: result
					});
				});	
			}				
		}
	}					

	function rescopeToken(user, callback) {
		var  sql = query.getTokens(user);
		sql
			.on('error', function(err) {
				throw err;
			})
			.on('result', function(row) {
				client.set(row.Token, 'rescope', function(err) {
					if (err) {
						throw err;
					}
					client.expire(row.Token, ((Date() - row.Expiration) / 1000).toFixed(0));
					if (callback) {
						callback();
					}
				});
			});
	}

	function logoutToken(user, callback) {
		var  sql = query.getTokens(user);
		sql
			.on('error', function(err) {
				throw err;
			})
			.on('result', function(row) {
				client.set(row.Token, 'logout', function(err) {
					if (err) {
						throw err;
					}
					client.expire(row.Token, ((Date() - row.Expiration) / 1000).toFixed(0));
					if (callback) {
						callback();
					}
				});
			});
	}

	function uploadAvatar(req, res) {
		easyimage.rescrop({
			src: req.file.destination + req.file.filename, dst: __dirname + '/public/img/avatar/' + req.body.email + '.jpg',
			width: 500, height: 500,
			cropwidth: 128, cropheight: 128,
			x: 0, y: 0
		}).then(
		function() {
			return res.status(200).json({
				success: true,
				token: req.token
			});			
		},
		function() {
			return res.status(400).json({
				success: false,
				message: 'Could not upload image',
				token: req.token
			});			
		});
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
		editUser: editUser,
		changePassword: changePassword,
		inviteMember: inviteMember,
		getInvitedMembers: getInvitedMembers,
		addPosition: addPosition,
		getPositions: getPositions,
		removePosition: removePosition,
		editChapter: editChapter,
		createNational: createNational,
		removeUser: removeUser,
		removeChapter: removeChapter,
		removeNational: removeNational,
		removeMeeting: removeMeeting,
		removeReport: removeReport,
		removeInvite: removeInvite,
		getMeetings: getMeetings,
		getReports: getReports,
		createChapter: createChapter,
		createReport: createReport,
		editReport: editReport,
		editNational: editNational,
		editMeeting: editMeeting,
		editPosition: editPosition,
		uploadAvatar: uploadAvatar
	};
};

