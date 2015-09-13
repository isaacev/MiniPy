// [MiniPy] /test/lexer.js

var expect = require('chai').expect;
var getLexer = require('../build/minipy').debug.getLexer;

describe('lexer', function() {
	describe('.peek()', function() {
		it('should return null if given empty program', function() {
			var lexer = getLexer('');

			expect(lexer.peek()).to.equal(null);
			expect(lexer.peek()).to.equal(null);
		});

		it('should return null after exhausting inputs', function() {
			var lexer = getLexer('abc\n123');

			lexer.next(); // [ abc ]
			lexer.next(); // [ 123 ]

			expect(lexer.peek()).to.equal(null);
			expect(lexer.peek()).to.equal(null);
		});
	});

	describe('.next()', function() {
		it('should return null if given empty program', function() {
			var lexer = getLexer('');

			expect(lexer.next()).to.equal(null);
			expect(lexer.next()).to.equal(null);
		});

		it('should return null after exhausting input', function() {
			var lexer = getLexer('abc\n123 def');

			lexer.next(); // [ abc ]
			lexer.next(); // [ 123 ]
			lexer.next(); // [ def ]

			expect(lexer.next()).to.equal(null);
			expect(lexer.next()).to.equal(null);
		});
	});
});
