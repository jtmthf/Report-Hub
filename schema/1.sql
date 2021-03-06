CREATE DATABASE REPORT_HUB;

USE DATABASE REPORT_HUB;

CREATE TABLE National(
	Url			VARCHAR(255),
	Name		VARCHAR(64)						NOT NULL,
	PRIMARY KEY(Name)
) ENGINE=InnoDB;

CREATE TABLE Chapter(
	ID			INT								NOT NULL AUTO_INCREMENT,
	Name		VARCHAR(100)					NOT NULL,
	Xhtml		VARCHAR(255)					DEFAULT 'assets/xhmtl/default.xhmtl',
	Nationals	VARCHAR(64)						NOT NULL,
	SchoolName  VARCHAR(100),
	FOREIGN KEY(Nationals)						REFERENCES National(Name) ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY(ID)
) ENGINE=InnoDB;

CREATE TABLE User(
	Password	CHAR(60)						NOT NULL,
	Email		VARCHAR(100) 					NOT NULL,
	Avatar		VARCHAR(255) 					DEFAULT 'assets/img/default.jpg',
	First		VARCHAR(32),
	Last		VARCHAR(32),
	PRIMARY KEY(Email)
) ENGINE=InnoDB;

CREATE TABLE UserAddress(
	Street		VARCHAR(128)					NOT NULL,
	City		VARCHAR(128)					NOT NULL,
	State		CHAR(2)							NOT NULL,
	Zip			VARCHAR(10)						NOT NULL,
	Email		VARCHAR(100)					NOT NULL,
	FOREIGN KEY(Email)		 					REFERENCES User(Email) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Admin(
	Email		VARCHAR(100)					NOT NULL,
	FOREIGN KEY(Email)		 					REFERENCES User(Email) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Employee(
	Email		VARCHAR(100)					NOT NULL,
	Nationals	VARCHAR(64)						NOT NULL,
	FOREIGN KEY(Email)		 					REFERENCES User(Email) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(Nationals)						REFERENCES National(Name) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Advisor(
	Email		VARCHAR(100)					NOT NULL,
	Chapter 	INT 							NOT NULL,
	FOREIGN KEY(Email)		 					REFERENCES User(Email) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(Chapter)						REFERENCES Chapter(ID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Student(
	Email		VARCHAR(100)					NOT NULL,
	Chapter 	INT 							NOT NULL,
	FOREIGN KEY(Email)		 					REFERENCES User(Email) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY(Chapter)						REFERENCES Chapter(ID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Office(
	Admin		TINYINT(1)						NOT NULL DEFAULT 0,
	Title		VARCHAR(64)						NOT NULL,
	Chapter 	INT 							NOT NULL,
	Email		VARCHAR(100),
	FOREIGN KEY(Chapter)						REFERENCES Chapter(ID) ON DELETE CASCADE,
	FOREIGN KEY(Email)							REFERENCES User(Email) ON DELETE SET NULL ON UPDATE CASCADE,
	PRIMARY KEY(Title, Chapter)
) ENGINE=InnoDB;

CREATE TABLE Asset(
	File		VARCHAR(255)					NOT NULL,
	Chapter 	INT 							NOT NULL,
	FOREIGN KEY(Chapter)						REFERENCES Chapter(ID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Meeting(
	ID			INT 							NOT NULL AUTO_INCREMENT,
	Day			DATETIME,
	Chapter 	INT 							NOT NULL,
	Title       VARCHAR(100)                    NOT NULL,
	FOREIGN KEY(Chapter)						REFERENCES Chapter(ID) ON DELETE CASCADE,
	PRIMARY KEY(ID)
) ENGINE=InnoDB;

CREATE TABLE Report(
	Html		TEXT,
	Plain		TEXT,
	ID			INT 							NOT NULL AUTO_INCREMENT,
	Created		DATETIME						NOT NULL,
	Edited		DATETIME,
	Meeting 	INT 							NOT NULL,
	Office 		VARCHAR(64)						NOT NULL,
	Chapter 	INT								NOT NULL,
	Author      VARCHAR(64),
	FOREIGN KEY(Meeting)						REFERENCES Meeting(ID) ON DELETE CASCADE,
	FOREIGN KEY(Office, Chapter)				REFERENCES Office(Title, Chapter),
	PRIMARY KEY(ID)
) ENGINE=InnoDB;

CREATE TABLE Permissions(
	HeadChapter	INT 							NOT NULL,
	HeadOffice 	VARCHAR(64) 					NOT NULL,
	SubChapter	INT 							NOT NULL,
	SubOffice 	VARCHAR(64) 					NOT NULL,
	FOREIGN KEY(HeadOffice, HeadChapter)		REFERENCES Office(Title, Chapter) ON DELETE CASCADE,
	FOREIGN KEY(SubOffice, SubChapter)			REFERENCES Office(Title, Chapter) ON DELETE CASCADE,
	CHECK(HeadChapter=SubChapter)
) ENGINE=InnoDB;

CREATE TABLE Token(
	Token 		CHAR(32)                        NOT NULL,
	User		VARCHAR(100),
	Expiration	TIMESTAMP,
	FOREIGN KEY(User)			                REFERENCES User(Email) ON DELETE CASCADE,
	PRIMARY KEY(Token)
) ENGINE=InnoDB;

CREATE TABLE Invite(
	Email		VARCHAR(100) 				   NOT NULL,
	Chapter     INT, 
	Position      VARCHAR(64),
	Nationals    VARCHAR(64),
	Role         VARCHAR(8)                    NOT NULL,
	PRIMARY KEY(Email),
	FOREIGN KEY(Position, Chapter)             REFERENCES Office(Title, Chapter) ON DELETE SET NULL,
	FOREIGN KEY(Chapter)                       REFERENCES Chapter(ID) ON DELETE CASCADE,
	FOREIGN KEY(Nationals)                     REFERENCES National(Name) ON DELETE CASCADE ON UPDATE CASCADE 
) ENGINE=InnoDB;

CREATE EVENT clearExpired
ON SCHEDULE AT CURRENT_TIMESTAMP + INTERVAL 2 MINUTE
DO
   DELETE FROM Token
    WHERE Token.Expiration < NOW();
