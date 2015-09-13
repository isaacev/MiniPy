// [MiniPy] /test/language.js

var expect = require('chai').expect;
var MiniPy = require('../build/minipy');

var isValid = function(isValid) {
	expect(isValid).to.be.true;
};

var isNotValid = function(isValid) {
	expect(isValid).to.be.an.instanceof(MiniPy.debug.MiniPyError);
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
				expect(MiniPy.run.bind(MiniPy, 'true')).to.throw(MiniPy.debug.MiniPyError);
				expect(MiniPy.run.bind(MiniPy, 'false')).to.throw(MiniPy.debug.MiniPyError);
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
