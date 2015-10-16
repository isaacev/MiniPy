// [MiniPy] /gulpfile.js

var gulp = require('gulp');

// required for `build` task
var concat = require('gulp-concat-util');
var formatter = require('gulp-esformatter');
var rename = require('gulp-rename');

var package = require('./package.json');

// required for `bump` task
var bump = require('gulp-bump');

gulp.task('build', function() {
	var stream = gulp.src([
		// header partial
		'src/partials/header.js',

		// error module
		'src/enums.js',
		'src/error/range.js',
		'src/error/error.js',

		// parser modules
		'src/parser/scanner.js',
		'src/parser/token.js',
		'src/parser/lexer.js',
		'src/parser/parser.js',

		// runtime modules
		'src/runtime/types.js',
		'src/runtime/scope.js',
		'src/runtime/interpreter.js',

		// root module (houses API)
		'src/root.js',

		// footer partial
		'src/partials/footer.js',
		])
		.pipe(concat(package.version + '.js', {
			process: function(mod) {
				return '\n' + mod.trim() + '\n';
			},
		}))
		.pipe(concat.header('// MiniPy.js v' + package.version + '\n'))
		.pipe(formatter({ indent: { value: '	', }, }))
		.pipe(gulp.dest('build'));

	return stream;
});

gulp.task('bump', function() {
	gulp.src(['./package.json', './bower.json'])
		.pipe(bump())
		.pipe(gulp.dest('./'));
});

gulp.task('dist', ['build'], function() {
	gulp.src('./build/' + package.version + '.js')
		.pipe(rename('minipy.js'))
		.pipe(gulp.dest('./dist'));
});
