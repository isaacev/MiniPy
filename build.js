#!/usr/bin/env node

var fs = require('fs');
var async = require('async');
var esprima = require('esprima');
var escodegen = require('escodegen');
var uglify = require('uglify-js');

var filenameMap = {
	'scanner': './src/parser/scanner.js',
	'token': './src/parser/token.js',
	'lexer': './src/parser/lexer.js',
	'parser': './src/parser/parser2.js',

	'scope': './src/runtime/scope.js',
	'interpreter': './src/runtime/interpreter.js',

	'error': './src/error.js',
	'main': './src/minipy.js',

	'build': {
		uncompressed: './build/minipy.js',
		minified: './build/minipy.min.js',
	},
};

var parserOpts = {
	comments: false,
};

function decodeModule(module, done) {
	fs.readFile(filenameMap[module], 'utf8', function(err, contents) {
		if (err) {
			done(err);
		} else {
			var syntax = esprima.parse(contents, {
				attachComment: parserOpts.comments,
			});
			done(null, syntax);
		}
	})
}

function writeBuild(syntax, done) {
	var uncompressed = escodegen.generate(syntax, {
		comment: parserOpts.comments,
	});

	var minified = uglify.minify(uncompressed, {
		fromString: true,
	});

	function once(fn, context) {
		var result;

		return function() {
			if (fn) {
				result = fn.apply(context || this, arguments);
				fn = null;
			}

			return result;
		};
	}

	var callDoneOnce = once(done);

	fs.writeFile(filenameMap['build'].uncompressed, uncompressed, 'utf8', callDoneOnce);
	fs.writeFile(filenameMap['build'].minified, minified.code, 'utf8', callDoneOnce);
}

function prepend(root, prefix) {
	prefix.reverse();

	for (var i = 0, l = prefix.length; i < l; i++) {
		root.unshift(prefix[i]);
	}
}

function insertModule(moduleName, syntax) {
	return function(next) {
		decodeModule(moduleName, function(err, moduleSyntax) {
			if (err) {
				console.error(err);
				next(err);
			} else {
				syntax.body[0].declarations[0].init.callee.body.body.unshift(moduleSyntax);
				next(null);
			}
		});
	};
}

decodeModule('main', function(err, syntax) {
	if (err) {
		console.error(err);
	} else {
		async.series([
			insertModule('error', syntax),
			insertModule('scanner', syntax),
			insertModule('token', syntax),
			insertModule('lexer', syntax),
			insertModule('parser', syntax),
			insertModule('scope', syntax),
			insertModule('interpreter', syntax),
		].reverse(), function(err) {
			writeBuild(syntax, function(err) {
				if (err) {
					console.error(err);
				} else {
					console.log('Wrote to ./build/minipy.js');
					console.log('Wrote to ./build/minipy.min.js');
				}
			});
		});
	}
});
