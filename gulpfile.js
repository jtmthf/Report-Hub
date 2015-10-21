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
	return gulp.src(['app/*.js',
			 'web/*.js'],
			{base: 'src/'})
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

// Mocha Task
gulp.task('mocha', function() {
	return gulp.src('test/test.js', {read: false})
		.pipe(mocha());
});

// Concatenate & Minify App JS
gulp.task('scripts', function() {
	return gulp.src('src/app/*.js')
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/app'))
		.pipe(rename('all.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist/app'))
});


// Watch Files For Changes
gulp.task('watch', function() {
	gulp.watch(['src/app/*.js', 'src/web/*.js'], ['lint']);
	gulp.watch('src/app/*.js', ['scripts', 'mocha']);
});

// Deafult Task
gulp.task('default', ['lint', 'mocha', 'scripts', 'watch']);


