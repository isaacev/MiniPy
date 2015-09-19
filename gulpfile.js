// [MiniPy] /gulpfile.js

var gulp = require('gulp');
var concat = require('gulp-concat-util');
var formatter = require('gulp-esformatter');

gulp.task('default', function() {
	gulp.src([
		// header partial
		'src/partials/header.js',

		// error module
		'src/error/errorType.js',
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
