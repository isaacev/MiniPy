// [MiniPy] /test/scanner.js

var expect = require('chai').expect;
var Scanner = require('../src/parser/scanner').Scanner;

describe('scanner', function() {
	describe('.peek()', function() {
		it('should return next character but not advance scanner', function() {
			var scanner = new Scanner('abc');

			expect(scanner.peek()).to.equal('a');

			scanner.next();

			expect(scanner.peek()).to.equal('b');
			expect(scanner.peek()).to.equal('b');

			scanner.next();

			expect(scanner.peek()).to.equal('c');
			expect(scanner.peek()).to.equal('c');

			scanner.next();
		});

		it('should return null if input is exhausted', function() {
			var scanner = new Scanner('abc');

			scanner.next();
			scanner.next();
			scanner.next();

			expect(scanner.peek()).to.equal(null);
			expect(scanner.peek()).to.equal(null);
		});
	});

	describe('.next()', function() {
		it('should return next character', function() {
			var scanner = new Scanner('abc');

			expect(scanner.next()).to.equal('a');
			expect(scanner.next()).to.equal('b');
			expect(scanner.next()).to.equal('c');
		});

		it('should repeatedly return null after exhausting input', function() {
			var scanner = new Scanner('abc');

			expect(scanner.next()).to.equal('a');
			expect(scanner.next()).to.equal('b');
			expect(scanner.next()).to.equal('c');

			expect(scanner.next()).to.equal(null);
			expect(scanner.next()).to.equal(null);
		});
	});

	describe('.EOF()', function() {
		it('should return false until input is exhausted', function() {
			var scanner = new Scanner('abc');

			expect(scanner.EOF()).to.equal(false);
			expect(scanner.EOF()).to.equal(false);

			scanner.next();
			scanner.next();
			scanner.peek();

			expect(scanner.EOF()).to.equal(false);
		});

		it('should return true after input is exhausted', function() {
			var scanner = new Scanner('abc');

			scanner.next();
			scanner.next();
			scanner.peek();

			expect(scanner.EOF()).to.equal(false);

			scanner.next();

			expect(scanner.EOF()).to.equal(true);
			expect(scanner.EOF()).to.equal(true);
		});
	});

	describe('.line count', function() {
		it('should start at 0', function() {
			var scanner = new Scanner('abc');

			expect(scanner.line).to.equal(0);
		});

		it('should increment after passing \\n character', function() {
			var scanner = new Scanner('abc\ndef');

			scanner.next(); // a
			scanner.next(); // b
			scanner.next(); // c
			
			expect(scanner.line).to.equal(0);

			scanner.next(); // \n

			expect(scanner.line).to.equal(1);

			scanner.next(); // d
			scanner.next(); // e
			scanner.next(); // f
			scanner.next(); // null

			expect(scanner.line).to.equal(1);
		});
	});

	describe('.column count', function() {
		it('should start at 0', function() {
			var scanner = new Scanner('abc');

			expect(scanner.column).to.equal(0);
		});

		it('should increment after passing non-\\n characters', function() {
			var scanner = new Scanner('abcdef');

			expect(scanner.column).to.equal(0);

			scanner.next(); // a
			scanner.next(); // b

			expect(scanner.column).to.equal(2);
			expect(scanner.column).to.equal(2);

			scanner.next(); // c
			scanner.next(); // d
			scanner.next(); // e

			expect(scanner.column).to.equal(5);
		});

		it('should reset after passing \\n characters', function() {
			var scanner = new Scanner('abc\ndef');

			scanner.next(); // a
			scanner.next(); // b
			scanner.next(); // c
			
			expect(scanner.column).to.equal(3);

			scanner.next(); // \n

			expect(scanner.column).to.equal(0);

			scanner.next(); // d
			scanner.next(); // e
			scanner.next(); // f
			scanner.next(); // null

		});
	});
});
