// [MiniPy] /gulpfile.js

var gulp = require('gulp');

// required for `build` task
var concat = require('gulp-concat-util');
var formatter = require('gulp-esformatter');

// required for `test` task
var mocha = require('gulp-mocha');

// required for `bump` task
var bump = require('gulp-bump');

gulp.task('build', function() {
	gulp.src([
		// header partial
		'src/partials/header.js',

		// error module
		'src/enums.js',
		'src/error/error.js',

		// parser modules
		'src/parser/scanner.js',
		'src/parser/token.js',
		'src/parser/lexer.js',
		'src/parser/parser.js',

		// runtime modules
		'src/runtime/scope.js',
		'src/runtime/interpreter.js',

		// root module (houses API)
		'src/root.js',

		// footer partial
		'src/partials/footer.js',
		])
		.pipe(concat('minipy.js', {
			process: function(mod) {
				return '\n' + mod.trim() + '\n';
			},
		}))
		.pipe(concat.header('// MiniPy.js\n'))
		.pipe(formatter({ indent: { value: '	', }, }))
		.pipe(gulp.dest('build'));
});

gulp.task('test', function() {
	gulp.src('./test/*.js', { read: false })
		.pipe(mocha({ reporter: 'progress' }));
});

gulp.task('bump', function() {
	gulp.src('./package.json')
		.pipe(bump())
		.pipe(gulp.dest('./'));
});

gulp.task('default', [
	'build',
	'test',
]);
