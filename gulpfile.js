// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var webpack = require('webpack-stream');

// Lint Task
gulp.task('lint', function() {
	return gulp.src('app/api/*.js')
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
gulp.task('public', function() {
	return gulp.src('public/*')
		.pipe(gulp.dest('dist/debug/public'))
});

gulp.task('webpack', function() {
	return gulp.src('app/client/**/*.js')
		.pipe(webpack({
			output: {
        		filename: 'bundle.js',
        		chunkFilename: '[id].chunk.js'
      		},
      		module: {
	      		loaders: [
	      			{
	      				test: /\.jsx?$/,
	      				exclude: /(node_modules|bower_components)/,
	      				loader: 'babel',
	      				query: {
				          presets: ['es2015', 'react']
				        }
	      			}
	      		]      			
      		}
		}))
		.pipe(gulp.dest('dist/debug/public'))
});

// Watch Files For Changes
gulp.task('watch', function() {
	gulp.watch(['app/**/*.js', 'public/js/*.js'], ['lint', 'mocha', 'app-scripts', 'public']);
});

// Deafult Task
gulp.task('default', ['lint', 'app-scripts', 'public', 'webpack']);

// Watch Task
gulp.task('watch', ['lint', 'mocha', 'app-scripts', 'public', 'watch']);
