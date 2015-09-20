// [MiniPy] /test/3_language.js

var expect = require('chai').expect;
var MiniPy = require('../build/minipy');

var isValid = function(isValid) {
	expect(isValid).to.be.true;
};

var isNotValid = function(isValid) {
	expect(isValid).to.be.an.instanceof(MiniPy.Error);
};

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
		describe('Integers', function() {
			it('should permit unsigned integers', function() {
				isValid(MiniPy.validate('123'));
				isValid(MiniPy.validate('0'));
			});

			it('should permit positively signed integers', function() {
				isValid(MiniPy.validate('+456'));
				isValid(MiniPy.validate('+001'));
			});

			it('should permit negatively signed integers', function() {
				isValid(MiniPy.validate('-789'));
				isValid(MiniPy.validate('-0'));
			});
		});

		describe('Floats', function() {
			it('should not permit floats without a leading digit', function() {
				isNotValid(MiniPy.validate('.5'));
				isNotValid(MiniPy.validate('.420'));
			});

			it('should permit unsigned floats', function() {
				isValid(MiniPy.validate('1.2'));
				isValid(MiniPy.validate('0.345494949'));
			});

			it('should permit positively signed floats', function() {
				isValid(MiniPy.validate('+2.3'));
				isValid(MiniPy.validate('+123.0'));
			});

			it('should permit negatively signed floats', function() {
				isValid(MiniPy.validate('-599384.0'));
				isValid(MiniPy.validate('-123.5'));
			});

			it('should not permit floats with multiple decimals', function() {
				isNotValid(MiniPy.validate('3.4.'));
				isNotValid(MiniPy.validate('45.0.9999'));
				isNotValid(MiniPy.validate('8.8.8.8'));
			});
		});
	});

	describe('Booleans', function() {
		it('should permit boolean literals', function() {
			MiniPy.run('True\nFalse');
		});

		it('should not permit uncapitalized boolean literals', function() {
			expect(MiniPy.run.bind(MiniPy, 'true')).to.throw(MiniPy.Error);
			expect(MiniPy.run.bind(MiniPy, 'false')).to.throw(MiniPy.Error);
		});
	});
});
