// [MiniPy] /test/1_lexer.js

var expect = require('chai').expect;
var Scanner = require('../src/parser/scanner').Scanner;
var Lexer = require('../src/parser/lexer').Lexer;

describe('lexer', function() {
	describe('.peek()', function() {
		it('should return EOF token then null if given empty program', function() {
			var scanner = new Scanner('');
			var lexer = new Lexer(scanner);

			expect(lexer.peek()).to.have.property('type').to.equal('EOF');

			lexer.next(); // [ EOF ]

			expect(lexer.peek()).to.equal(null);
		});

		it('should return EOF token then null after exhausting inputs', function() {
			var scanner = new Scanner('abc\n123');
			var lexer = new Lexer(scanner);

			lexer.next(); // [ abc ]
			lexer.next(); // [ \n  ]
			lexer.next(); // [ 123 ]

			expect(lexer.peek()).to.have.property('type').to.equal('EOF');

			lexer.next(); // [ EOF ]

			expect(lexer.peek()).to.equal(null);
		});
	});

	describe('.next()', function() {
		it('should return EOF token then null if given empty program', function() {
			var scanner = new Scanner('');
			var lexer = new Lexer(scanner);

			expect(lexer.next()).to.have.property('type').to.equal('EOF');
			expect(lexer.next()).to.equal(null);
		});

		it('should return EOF token then null after exhausting input', function() {
			var scanner = new Scanner('abc\n123 def');
			var lexer = new Lexer(scanner);

			lexer.next(); // [ abc ]
			lexer.next(); // [ \n  ]
			lexer.next(); // [ 123 ]
			lexer.next(); // [ def ]

			expect(lexer.next()).to.have.property('type').to.equal('EOF');
			expect(lexer.next()).to.equal(null);
		});
	});
});
