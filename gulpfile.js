// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Lint Task
gulp.task('lint', function() {
	return gulp.src('app/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

// Mocha Task
gulp.task('mocha', function() {
	return gulp.src('test/test.js', {read: false})
		.pipe(mocha());
});

// Relocate App JS
gulp.task('app-scripts', function() {
	return gulp.src(['app/api/*.js',
					 'server.js',
					 'config/*'])
		.pipe(gulp.dest('dist/debug'))
});

// Concatenate & Minify Public JS
gulp.task('public-scripts', function() {
	return gulp.src('public/js/*.js')
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/public'))
		.pipe(rename('all.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist/public'))
});

// Watch Files For Changes
gulp.task('watch', function() {
	gulp.watch(['app/**/*.js', 'public/js/*.js'], ['lint', 'mocha', 'app-scripts', 'public-scripts']);
});

// Deafult Task
gulp.task('default', ['lint', 'app-scripts', 'public-scripts']);

// Watch Task
gulp.task('watch', ['lint', 'mocha', 'app-scripts', 'public-scripts', 'watch']);
