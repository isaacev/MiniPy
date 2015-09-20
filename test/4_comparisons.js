// [MiniPy] /test/4_comparisons.js

var expect = require('chai').expect;
var MiniPy = require('../build/minipy');

describe('Comparison', function() {
	function test(script) {
		MiniPy.run(script, {
			globals: {
				test: function(should, is) {
					expect(is).to.equal(should);
				}
			}
		});
	}

	describe('Booleans', function() {
		describe('NOT', function() {
			it('should invert boolean state of its operand', function() {
				test('test(False, not True)');
				test('test(True, not False)');
			});

			it('should be capable of compounding', function() {
				test('test(True, not not True)');
				test('test(False, not not False)');
				test('test(not True, not True)');
				test('test(not False, not False)');
			});

			it('should not work on numbers', function() {
				expect(test.bind(test, 'test(False,  not -1)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,    not 0)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(False, not 0.5)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(False, not 123)')).to.throw(MiniPy.Error);
			});

			it('should not work on strings', function() {
				expect(test.bind(test, 'test(False,   not "abc")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,       not "")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(False, not "False")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(False,     not "0")')).to.throw(MiniPy.Error);
			});
		});

		describe('AND', function() {
			it('should return true only if both operands are true', function() {
				test('test(True, True and True)');
				test('test(False, True and False)');
				test('test(False, False and True)');
				test('test(False, False and False)');
			});

			it('should be capable of being used in series', function() {
				test('test(True, True and True and True)');
				test('test(False, True and False and True)');
				test('test(False, False and True and False)');
				test('test(False, False and False and True)');
			});

			it('should not work on numbers', function() {
				expect(test.bind(test, 'test(True, 123 and 123)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,     0 and 0)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,  True and 1)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,    -1 and 1)')).to.throw(MiniPy.Error);
			});

			it('should not work on strings', function() {
				expect(test.bind(test, 'test(True,         "" and "")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, "True" and "True")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,   "True" and True)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,   "abc" and "abc")')).to.throw(MiniPy.Error);
			});
		});

		// describe OR
	});

	// describe < <= > >= == !=
});
