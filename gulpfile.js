// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var webpack = require('webpack-stream');

// Lint Task
gulp.task('lint', function() {
	return gulp.src(['server.js', 'app/api/*.js'])
		.pipe(eslint({
			extends: 'eslint:recommended',
			rules: {
				strict: 2
			},
			envs: [
				'node'
			]
		}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
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
	return gulp.src('public/**/*')
		.pipe(gulp.dest('dist/debug/public'))
});

gulp.task('webpack', function() {
	return gulp.src('app/client/**/*.js')
		.pipe(webpack({
			colors: true,
			entry: './app/client/app.js',
			output: {
        		filename: 'bundle.js',
        		chunkFilename: '[id].chunk.js'
      		},
      		watch: true,
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
	gulp.watch(['server.js', 'app/api/*.js'], ['lint', 'app-scripts', 'public']);
});

// Deafult Task
gulp.task('default', ['lint', 'app-scripts', 'public', 'webpack', 'watch']);
