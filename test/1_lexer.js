// [MiniPy] /test/1_lexer.js

var expect = require('chai').expect;
var Scanner = require('../src/parser/scanner').Scanner;
var Lexer = require('../src/parser/lexer').Lexer;

var TokenType = require('../src/enums').enums.TokenType;

describe('lexer', function() {
	describe('#curr()', function () {
		it('should return the current token', function() {
			var scanner = new Scanner('123 :');
			var lexer = new Lexer(scanner);

			lexer.next(); // [ 123 ]

			expect(lexer.curr()).to.have.property('type').to.equal(TokenType.NUMBER);
			expect(lexer.curr()).to.have.property('type').to.equal(TokenType.NUMBER);

			lexer.next(); // [ : ]

			expect(lexer.curr()).to.have.property('type').to.equal(TokenType.PUNCTUATOR);
			expect(lexer.curr()).to.have.property('type').to.equal(TokenType.PUNCTUATOR);
		});

		it('should return EOF token then null after input is exhausted', function() {
			var scanner = new Scanner('123 456');
			var lexer = new Lexer(scanner);

			lexer.next(); // [ 123 ]
			lexer.next(); // [ 456 ]
			lexer.next(); // [ EOF ]

			expect(lexer.curr()).to.have.property('type').to.equal(TokenType.EOF);
			expect(lexer.curr()).to.have.property('type').to.equal(TokenType.EOF);

			lexer.next(); // [ null ]

			expect(lexer.curr()).to.equal(null);
			expect(lexer.curr()).to.equal(null);
		});
	});

	describe('#peek()', function() {
		it('should return EOF token then null if given empty program', function() {
			var scanner = new Scanner('');
			var lexer = new Lexer(scanner);

			expect(lexer.peek()).to.have.property('type').to.equal(TokenType.EOF);

			lexer.next(); // [ EOF ]

			expect(lexer.peek()).to.equal(null);
		});

		it('should return EOF token then null after exhausting inputs', function() {
			var scanner = new Scanner('abc\n123');
			var lexer = new Lexer(scanner);

			lexer.next(); // [ abc ]
			lexer.next(); // [ \n  ]
			lexer.next(); // [ 123 ]

			expect(lexer.peek()).to.have.property('type').to.equal(TokenType.EOF);

			lexer.next(); // [ EOF ]

			expect(lexer.peek()).to.equal(null);
		});
	});

	describe('#next()', function() {
		it('should return EOF token then null if given empty program', function() {
			var scanner = new Scanner('');
			var lexer = new Lexer(scanner);

			expect(lexer.next()).to.have.property('type').to.equal(TokenType.EOF);
			expect(lexer.next()).to.equal(null);
		});

		it('should return EOF token then null after exhausting input', function() {
			var scanner = new Scanner('abc\n123 def');
			var lexer = new Lexer(scanner);

			lexer.next(); // [ abc ]
			lexer.next(); // [ \n  ]
			lexer.next(); // [ 123 ]
			lexer.next(); // [ def ]

			expect(lexer.next()).to.have.property('type').to.equal(TokenType.EOF);
			expect(lexer.next()).to.equal(null);
		});
	});
});
