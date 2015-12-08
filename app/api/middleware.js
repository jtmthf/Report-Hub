// app/api/middleware.js

module.exports = function(app, pool) {
	"use strict"

	//Including frameworks that we use throughout the project
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


	//Function to register a new user
	function register(req, res) {

		//Validate input parameters
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

		//Handle errors with input parameters if they exist
		var errors = req.validationErrors();

		if (errors || req.body.password != req.body.confirmation) {
			return res.status(400).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			//Seeds the hash of the password
			bcrypt.hash(req.body.password, 10, function(err, hash) {

				if (err) {
					//throw err
					res.status(500).json({
						success: false,
						message: 'Could not hash password',
						errors: err
					});
				} else {
					//calls the function to manipulate the database
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
							//If the query.register function succeeds, create a token for the user
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

	//Function to login a user
	function login(req, res) {
		var email = req.body.email;
		var password = req.body.password;

		if (email && password) {
			//Get the password hash
			query.getHash(email, function(err, result) {
				if (err) {
					throw err;
				}
				//Return error message if needed
				if (!result[0]) {
					return res.status(400).json({
						success: false,
						message: 'Username or password was incorrect'
					});
				} else {
					//Pulls hash from database and compares it to make sure that the 2 hashes are equivalent
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
							//If login is successful, generate token for user
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

	//Function to generate a token for a user
	function genToken(user, callback) {
		//Calls the query function to get the permissions of the user from the database
		query.getScope(user, function(err, result) {
			if (err) {
				throw err;
			} else {
				var scope = {};
				if (result[0]) {
					// Sets permissions in object format to be stored in token
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
					// If user has a position in the chapter, get any sub positions they may have
					if (scope.position.title) {
						var subs = [];
						// recursively call get subpositions and place in flat map
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

	//Function to generate a json web token and add a copy of it to mysql database
	function createAddToken(scope, user, callback) {
		// sign jwt token
		var token = jwt.sign(scope, app.get('jwtSecret'), {
			expiresIn: 604800 // expires in 7 days
		});
		// keep list of valid tokens in the MySQL database
		query.addToken(md5(token), user, moment().add(604800, 's').toDate(), function(err) {
			if (err && err.code !== "ER_DUP_ENTRY") {
				throw err; 
			}
		});
		callback(scope, token);
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

	function changePassword(req, res) {
		//Validates input parameters
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

		//Handles errors if they exist
		if (errors) {
			return res.status(400).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			//Get the password hash if the login is successful
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
					//Compares the two hashes to make sure that they are equivalent
					bcrypt.compare(req.body.oldPassword, result[0].Password, function(err, bres) {
						if (err) {
							throw err;
						}
						//Did not succeed because prev. password entered was not correct
						if (!bres) {
							res.status(400).json({
								success: false,
								message: 'Old password was incorrect'
							});
						} else {
							//If old password entered was correct, hash the new password
							bcrypt.hash(req.body.newPassword, 10, function(err, hash) {
								if (err) {
									throw err;
								}
								//Call the query function to update the password in the database
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

	//Function to get invited members based on certain criteria
	function getInvitedMembers(req, res) {
		//Validate input parameters
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//Call the query function to get the invited members of a chapter
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

	//Function to invite a new member to use the web application
	function inviteMember(req, res) {
		//Validate input parameters
		req.checkBody('email', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//If an email, chapter ID, and student or advisor role were passed in
			if(email && chapID && (role == 'student' || role == 'advisor')) {
				//Call the query function to insert an invited chapter member into the database
				query.inviteChapMember(email, chapID, role, posTitle, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						invite: result
					});
				});				
			//If an employee role, and email, and a national name were passed in
			} else if (role == 'employee' && email && natName) {
				//Call the query function to insert an invited employee into the database
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

	//Function to remove an invite from the database
	function removeInvite(req, res) {
		//Validate input parameters
		req.checkQuery('email', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var email = req.body.email;

			//Call the query function to remove an invite from the database using the person's email
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

	//Function to get users based on different criteria
	function getUsers(req, res) {
		//Validate input parameters
		req.checkQuery('email', 'Not a valid email.').optional().isEmail();
		req.checkQuery('role', 'Not a valid string.').optional().isAlpha();
		req.checkQuery('chapID', 'Not an integer.').optional().isInt();
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();		

		var errors = req.validationErrors();
		//Handle any errors with parameter validation
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {

			var role = req.body.role;
			var chapID = req.body.chapID;
			var natName = req.body.natName;
			var searchString = req.body.searchString;
			var pageNumber = req.body.pageNumber;
			var pageSize = req.body.pageSize;

			//If we want students
			if (role == 'student') {
				//If we need to search by chapter
				if(chapID) {
					//Call the query function to get the student from the chapter
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
				//If we need to search by national organization
				else if (natName) {
					//Call the query function to get the student from the national organization
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
				//If we don't need to search by chapter or national org.
				else {
					//Call the query function to get all students
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
			//If we want advisors
			else if (role == 'advisor') {
				//If we want to search by chapter
				if(chapID) {
					//Call the query function to get advisor of chapter from database
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
				//If we want to search by National organizaiton
				else if (natName) {
					//Call the query function to get the advisors within a national organization from the database
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
				//If we don't want to search by chapter or national organization
				else {
					//Call the query function to get all the advisors from the database
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
			//If we want admins
			else if (role == 'admin') {
				//Call the query function to get all the admins from the database
				query.getUserByAdminRole(pageNumber, pageSize, searchString, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						users: result
					});
				});					
			}
			//If we want employees
			else if (role == 'employee') {
				//If we want to search by national organization
				if (natName) {
					//Call the query function to get employee of national organization from the database
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
				//If we don't want to search by national organization
				else {
					//Call the query function to get all employees from database
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
			//If role of user isn't specified and we want to search by chapter
			else if (chapID) {
				//Call the query function to get users within a chapter from the database
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
			//If the role of the user isn't specified and we don't want to search by chapter
			else {
				//Call the query function to get all users from the database (narrowed down by searchString that the user enters)
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

	//Function to edit/update a user
	function editUser(req, res) {
		//Validate input parameters
		req.checkBody('fname', 'Not a string.').isAlpha();
		req.checkBody('lname', 'Not a string.').isAlpha();
		req.checkBody('email', 'Not an email.').isEmail();
		req.checkBody('newEmail', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//Call the query function to update a user in the database (update all the attributes)
			query.editUser(fname, lname, email, newEmail, function(err, result) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true,
					user: result
				});
			});
			//Rescope the token for the user with the new email
			rescopeToken(newEmail);					
		}
	}

	//Function to remove a user from the database
	function removeUser(req, res) {
		//Validate input parameters
		req.checkQuery('email', 'Not an email.').isEmail();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var email = req.body.email;

			//Call the query function to remove a user from the database using their email
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

	//Function to get national organizations from the database based on certain criteria
	function getNationals(req, res) {
		//Validate input parameters
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();
		req.checkQuery('email', 'Not an email.').optional().isEmail();		

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//If we want to get the national organization that a chapter is a part of
			if(chapID) {
				//Call the neccessary query function to get the national org from the database
				query.getNationalByChapID(chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						nationals: result
					});
				});			
			//If we want to get the national organization that a user is a part of
			} else if(email) {
				//Call the neccessary query function to get the national org from the database
				query.getNationalByUser(email, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						nationals: result
					});
				});				
			//If we want to get all the national organizations from the database
			} else {
				//Call the neccessary query function to get the national org from the database
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

	//Function to create a new national organization
	function createNational(req, res) {
		//Validate input parameters
		req.checkBody('url', 'Not a valid URL.').optional().isURL();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			var url = req.body.url;
			var natName = req.body.natName;

			//Call the query function to insert a new national entity into the National table
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

	//Function to edit an existing national organization
	function editNational(req, res) {
		//Validate input parameters
		req.checkBody('url', 'Not a valid URL.').notEmpty().isURL();
		req.checkBody('name', 'Should not be empty.').notEmpty();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//If user wants to assign new name to national organization
			if(newName) {
				//Call query function to update national organization with newName and possibly a new URL
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
				//Call query function to update national organization with the same name and possibly a new URL
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

	//Function to remove national organization from database
	function removeNational(req, res) {
		var natName = req.body.natName;

		//Call the query function to remove a national organization from the database using the national name
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

	//Function to get chapters from the db based on different criteria
	function getChapters(req, res) {
		//validate input parameters
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();
		req.checkQuery('email', 'Not an email.').optional().isEmail();

		var errors = req.validationErrors();

		//Handle possible errors with validating input
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

			//If we want to get chapters by their chapter ID
			if(chapID) {
				//Call the neccessary query function to get the chapter from the database
				query.getChapterByID(chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapters: result
					});
				});
			//If we want to get chapters by the national organization they're a part of
			} else if(natName) {
				//Call the neccessary query function to get the chapters from the database
				query.getChapterByNational(pageNumber, pageSize, natName, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapters: result
					});
				});				
			//If we want to get the chapter that a user is a part of
			} else if(email) {
				//Call neccessary query function to get the chapter from the database
				query.getChapterByUser(email, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapters: result
					});
				});				
			//If we just want all the chapters
			} else {
				//Call the neccessary query function to get all the chapters from the database (narrowed down by searchString that user enters)
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

	//Function to create a new chapter
	function createChapter(req, res) {
		var chapName = req.body.chapName;
		var natName = req.body.natName;
		var schoolName = req.body.schoolName;

		//Call the query function to insert a new chapter entity into the Chapter table
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

	//Function to edit the attributes of a chapter
	function editChapter(req, res) {
		//Validate input parameters
		req.checkBody('removeStudent', 'Not an email.').optional().isEmail();		
		req.checkBody('removeAdvisor', 'Not an email.').optional().isEmail();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		} else {
			var removeStudent = req.body.removeStudent;
			var removeAdvisor = req.body.removeAdvisor;
			var chapID = req.body.chapID;
			var chapName = req.body.chapName;
			var school = req.body.school;

			//If we want to remove a student from the chapter
			if(removeStudent) {
				//Call the query function to remove the student from the chapter in the database
				query.removeStudentFromChapter(chapID, removeStudent, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapter: result
					});
				});
			//If we want to remove an advisor from the chapter
			} if(removeAdvisor) {
				//Call the query function to remove the advisor from the chapter in the database
				query.removeAdvisorFromChapter(chapID, removeAdvisor, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapter: result
					});
				});					
			//If we want to edit the chapter name
			} if(chapName) {
				//Call the query function to update the chapter name in the database
				query.editChapterName(chapID, chapName, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						chapter: result
					});
				});
			//If we want to edit the chapter school name
			} if(school) {
				//Call the query function to update the name of the school in the database
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

	//Function to remove a chapter from the database
	function removeChapter(req, res) {
		//Validate input parameters
		req.checkQuery('chapID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var chapID = req.body.chapID;

			//Call the query function to remove a chapter from the database using the chapter ID
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

	//Function to get positions based on certain criteria
	function getPositions(req, res) {
		//Validate input parameters
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();
		req.checkQuery('email', 'Not an email.').optional().isEmail();		

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//If we want to get all the positions within a chapter
			if(chapID) {
				//Call the query function to get positions of a chapter from the database
				query.getPositionsByChapter(pageNumber, pageSize, chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						positions: result
					});
				});			
			//If we want to get the position that a certain user has
			} else if(email) {
				//Call the query function to get the position that a user holds using their email
				query.getPositionByUser(email, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						positions: result
					});
				});				
			//If we want to get a position using its title
			} else if(chapID && posTitle){
				//Call the query function to get the position by its title from the database
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

	//Function to add a new position to a chapter
	function addPosition(req, res) {
		//Validate input parameters
		req.checkBody('admin', 'Not a boolean value.').isBoolean();
		req.checkBody('email', 'Not an email.').optional().isEmail();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//Call the query function to insert a new office into the Office table
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

	//Function to edit an existing position
	function editPosition(req, res) {
		//Validate input parameters
		req.checkBody('email', 'Not a valid email.').isEmail();
		req.checkBody('title', 'Should not be empty.').notEmpty();
		req.checkBody('admin', 'Not an integer.').notEmpty().isInt();
		req.checkBody('chapID', 'Not an integer.').notEmpty().isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//If we want to give a position a new title
			if(newTitle) {
				//Call the query function to update the Office entity with the new title as well as possibly a new admin value or new email
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
				//Call the query function to update the Office entity with the same title but possibly a new admin value or new email
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

	//Function to remove a position from the database
	function removePosition(req, res) {
		//Validate input parameters
		req.checkQuery('chapID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//Call the query function to remove a position from the database using posTitle and chapID
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

	//Function to recursively get all sub positions of a user
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

	//Function to get reports based on certain criteria
	function getReports(req, res) {
		//Validate input parameters
		req.checkQuery('mtgID', 'Not an integer.').optional().isInt();
		req.checkQuery('reportID', 'Not an integer.').optional().isInt();
		req.checkQuery('pageNumber', 'Not an integer.').optional().isInt();
		req.checkQuery('pageSize', 'Not an integer.').optional().isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//If we want to get all the reports by the members within a chapter
			if(chapID) {
				//Call the query functino to get the reports of a chapter from the database using chapter ID
				query.getReportsByChapter(pageNumber, pageSize, searchString, chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						report: result
					});
				});
			//If we want to get all the reports made by a certain position
			} else if(posTitle) {
				//Call the query function to get the reports made by a position from the database using position title
				query.getReportByPosition(posTitle, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						report: result
					});
				});				
			//If we want to get all the reports within a meeting
			} else if(mtgID) {
				//Call the query function to get the reports within a meeting from the database using the meeting ID
				query.getReportsByMeeting(pageNumber, pageSize, mtgID, searchString, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						report: result
					});
				});				
			//If we want to get a report using its ID
			} else if (reportID) {
				//Call the query function to get the report from the database
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

	//Function to create a new report
	function createReport(req, res) {
		// required fields Meeting, Office, Chapter
		// optional Html
		
		//Removes potentially dangerous script and style tags from html
		//To allow searching by reports, pulls out plain text content and generates text-only string that we can search against
		var plain = '';
		var clean = sanitizeHtml(req.body.html, {
			textFilter: function(text) {
				plain += ' ' + text;
			}
		});

		//Call query function to insert a new report entity into the database
		query.createReport(clean, plain, Date(), req.body.meeting, req.body.office, req.body.chapter, function(err) {
			if (err) {
				throw err;
			}
			return res.status(200).json({
				success: true
			});
		});
	}		

	//Function to edit existing reports
	function editReport(req, res) {
		//Validate input parameters
		req.checkBody('reportID', 'Need ID of report').notEmpty().isInt();
		
		//Removes potentially dangerous script and style tags from html
		//To allow searching by reports, pulls out plain text content and generates text-only string that we can search against
		var plain = '';
		var clean = sanitizeHtml(req.body.html, {
			textFilter: function(text) {
				plain += ' ' + text;
			}
		});

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}else {
			//Calls query function to update a report entity in the database
			query.editReport(clean, plain, Date(), req.body.meeting, req.body.office, req.body.reportID, function(err) {
				if (err) {
					throw err;
				}
				return res.status(200).json({
					success: true
				});
			});
		}
	}		

	//Function to remove a report from the database
	function removeReport(req, res) {
		//Validate input parameters
		req.checkQuery('reportID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var reportID = req.body.reportID;

			//Call the query function to remove report from database using reportID
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

	//Function to get meetings based on certain criteria
	function getMeetings(req, res) {
		//Validate input parameters
		req.checkQuery('mtgDay', 'Not a valid date.').optional().isDate();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//If we want to get all the meetings that a chapter has held
			if(chapID) {
				//Call the query function to get the meetings from the database using the chapter ID
				query.getMeetingByChapter(chapID, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						meeting: result
					});
				});
			//If we want to get the meeting that was held on a certain date
			} else if(mtgDay) {
				//Call the query function to get the meeting from the database using the meeting date
				query.getMeetingByDay(mtgDay, function(err, result) {
					if (err) {
						throw err;
					}
					return res.status(200).json({
						success: true,
						meeting: result
					});
				});				
			//If we want to get a meeting by its meeting ID
			} else if(mtgID) {
				//Call the query function to get the meeting from the database using the meeting ID
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

	//Function to create a new meeting
	function newMeeting(req, res) {

		//Validate the input parameters		
		req.checkBody('meetingDate', 'Date is invalid').isDate();
		req.checkBody('meetingTitle', 'Need a meeting title').notEmpty();
		req.checkBody('repeat', 'Option is invalid').matches(/^(none|daily|weekly|monthly)$/);
		req.checkBody('until', 'Date is invalid').isDate();

		var errors = req.validationErrors();

		//If there were errors in the parameter validation, throw errors
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

			//Create an array of meetings based on if the meetings must repeat daily, weekly, monthly, or never
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

			//Call the function to insert a new meeting into the database
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

	//Function to edit an existing meeting
	function editMeeting(req, res) {
		//Validate input parameters
		req.checkBody('day', 'Not a valid URL.').notEmpty().isDate();
		req.checkBody('title', 'Should not be empty.').notEmpty();
		req.checkBody('mtgID', 'Not an integer.').notEmpty().isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
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

			//Call the query function to update a meeting entity
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

	//Function to remove a meeting from the database
	function removeMeeting(req, res) {
		//Validate input parameters
		req.checkQuery('mtgID', 'Not an integer.').isInt();

		var errors = req.validationErrors();

		//Handle errors with validating input if needed
		if (errors) {
			return res.status(406).json({
				success: false,
				message: 'Could not validate input fields',
				errors: errors
			});
		}
		else {

			var mtgID = req.body.mtgID;

			//Call the query function to remove a meeting from the database using a meeting ID
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


	return {
		register: register,
		login: login,
		genToken: genToken,
		createAddToken: createAddToken,
		rescopeToken: rescopeToken,
		logoutToken: logoutToken,
		changePassword: changePassword,
		getInvitedMembers: getInvitedMembers,
		inviteMember: inviteMember,
		removeInvite: removeInvite,
		getNationals: getNationals,
		createNational: createNational,
		editNational: editNational,
		removeNational: removeNational,
		getUsers: getUsers,
		editUser: editUser,
		removeUser: removeUser,
		uploadAvatar: uploadAvatar,
		getChapters: getChapters,
		createChapter: createChapter,
		editChapter: editChapter,
		removeChapter: removeChapter,
		getPositions: getPositions,
		addPosition: addPosition,
		editPosition: editPosition,
		removePosition: removePosition,
		getSubPositions: getSubPositions,
		getReports: getReports,
		createReport: createReport,
		editReport: editReport,
		removeReport: removeReport,
		getMeetings: getMeetings,
		newMeeting: newMeeting,
		editMeeting: editMeeting,
		removeMeeting: removeMeeting
	};
};



