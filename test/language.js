// [MiniPy] /test/language.js

var expect = require('chai').expect;
var MiniPy = require('../build/minipy');
var MiniPyError =  MiniPy.debug.MiniPyError;

var isValid = function(isValid) {
	expect(isValid).to.be.true;
};

var isNotValid = function(isValid) {
	expect(isValid).to.be.an.instanceof(MiniPyError);
};

describe('Python subset', function() {
	describe('Literals', function() {
		describe('Strings', function() {
			describe('Single quotes', function() {
				it('should permit simple string', function() {
					isValid(MiniPy.validate('\'abc\''));
				});

				it('should permit escaped single quote', function() {
					isValid(MiniPy.validate('\'ab\\\'c\''));
				});

				it('should permit double quotes escaped and not escaped', function() {
					isValid(MiniPy.validate('\'a"bc\"def\''));
				});

				it('should not permit newline character', function() {
					isNotValid(MiniPy.validate('\'abc\ndef\''));
				});

				it('should not permit illegal escape characters', function() {
					isNotValid(MiniPy.validate('\'abc\rdef\''));
				});

				it('should not permit unterminated string (with unexpected EOF)', function() {
					isNotValid(MiniPy.validate('\'abc'));
				});

				it('should not permit unterminated string (with improper closing quote)', function() {
					isNotValid(MiniPy.validate('\'abc"'));
				});
			});

			describe('Double quotes', function() {
				it('should permit simple string', function() {
					isValid(MiniPy.validate('"abc"'));
				});

				it('should permit escaped double quote', function() {
					isValid(MiniPy.validate('"ab\\\"c"'));
				});

				it('should permit single quote escaped and not escaped', function() {
					isValid(MiniPy.validate('"abc\'d\\\'ef"'));
				});

				it('should not permit newline character', function() {
					isNotValid(MiniPy.validate('"abc\ndef"'));
				});

				it('should not permit illegal escape characters', function() {
					isNotValid(MiniPy.validate('"abc\rdef"'));
				});

				it('should not permit unterminated string (with unexpected EOF)', function() {
					isNotValid(MiniPy.validate('"abc'));
				});

				it('should not permit unterminated string (with improper closing quote)', function() {
					isNotValid(MiniPy.validate('"abc\''));
				});
			});
		});

		describe('Numbers', function() {
			it('should permit signed/unsigned integers', function() {
				isValid(MiniPy.validate('123'));
				isValid(MiniPy.validate('0'));

				isValid(MiniPy.validate('+456'));
				isValid(MiniPy.validate('+001'));

				isValid(MiniPy.validate('-789'));
				isValid(MiniPy.validate('-0'));
			});

			it('should permit signed/unsigned floats', function() {
				// ...
			});

			it('should permit exponent form', function() {
				// ...
			});

			it('should not permit illegal exponents', function() {
				// ...
			});
		});

		describe('Booleans', function() {
			it('should permit boolean literals', function() {
				MiniPy.run('True\nFalse');
			});

			it('should not permit uncapitalized boolean literals', function() {
				expect(MiniPy.run.bind(MiniPy, 'true')).to.throw(MiniPyError);
				expect(MiniPy.run.bind(MiniPy, 'false')).to.throw(MiniPyError);
			});
		});
	});

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

				it('should be capable of compounding', function () {
					test('test(True, not not True)');
					test('test(False, not not False)');
					test('test(not True, not True)');
					test('test(not False, not False)');
				});

				it('should not work on numbers', function() {
					expect(test.bind(test, 'test(False,  not -1)')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True,    not 0)')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(False, not 0.5)')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(False, not 123)')).to.throw(MiniPyError);
				});

				it('should not work on strings', function() {
					expect(test.bind(test, 'test(False,   not "abc")')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True,       not "")')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(False, not "False")')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(False,     not "0")')).to.throw(MiniPyError);
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

				it('should not work on numbers', function () {
					expect(test.bind(test, 'test(True, 123 and 123)')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True,     0 and 0)')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True,  True and 1)')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True,    -1 and 1)')).to.throw(MiniPyError);
				});

				it('should not work on strings', function () {
					expect(test.bind(test, 'test(True,         "" and "")')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True, "True" and "True")')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True,   "True" and True)')).to.throw(MiniPyError);
					expect(test.bind(test, 'test(True,   "abc" and "abc")')).to.throw(MiniPyError);
				});
			});
		});
	});

	describe('Variables', function() {
		// should permit binary variable assignment to literal

		// should permit assignment to local variable

		// should permit assignment to global variable

		// should not permit use of undefined variable
	});

	// comparisons (< <= > >= == != && ||)
	// prefix operators (! + -)
	// loops
	// if statements
	// order of operations
});
