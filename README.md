Instructions to Run Application

 

For best reliability, run off a Linux or Mac computer (or a Unix-like system), although windows can work.

 

1.     Install node.js

2.     Install Redis

3.     Install MySQL

4.     Install imagemagick

a.      All need to be available in your path

b.     It is recommended to use package manager apt-get for Debian-based systems or brew for OSX

5.     Download the project with “git clone https://github.com/jtmthf/Report-Hub”

6.     Once you’re in the root directory of project, run “npm install”

7.     In .zip file, under config/config.js, change the password to the password of the root user of your MySQL database.

8.     Run gulp by typing in “gulp” and pressing Enter.

a.      Install with “npm –g gulp” if you don’t already have it

9.     After about 20 seconds, the gulp task should finish, so press Ctrl+C to end it.

10.  Start the server by typing in “node dist/debug/server.js”.

11.  If the server crashes because any packages are unavailable, make sure they are installed using “npm install”.

12.  From a browser, access the web app at https://localhost:8443

13.  You will probably be warned that the website is using a self-signed certificate. Accept this to continue.
