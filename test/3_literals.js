// [MiniPy] /test/3_language.js

var expect = require('chai').expect;
var MiniPy = require('../build/minipy');

var noop = function() {};

var isValid = function(script) {
	MiniPy.run(script, {
		hooks: {
			print: noop,
		},
	});
};

var isNotValid = function(isValid) {
	expect(isValid).to.be.an.instanceof(MiniPy.Error);
};

describe('Literals', function() {
	describe('Strings', function() {
		describe('Single quotes', function() {
			it('should permit simple string', function() {
				isValid('\'abc\'');
			});

			it('should permit escaped single quote', function() {
				isValid('\'ab\\\'c\'');
			});

			it('should permit double quotes escaped and not escaped', function() {
				isValid('\'a"bc\"def\'');
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
				isValid('"abc"');
			});

			it('should permit escaped double quote', function() {
				isValid('"ab\\\"c"');
			});

			it('should permit single quote escaped and not escaped', function() {
				isValid('"abc\'d\\\'ef"');
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
				isValid('123');
				isValid('0');
			});

			it('should permit positively signed integers', function() {
				isValid('+456');
				isValid('+001');
			});

			it('should permit negatively signed integers', function() {
				isValid('-789');
				isValid('-0');
			});
		});

		describe('Floats', function() {
			it('should not permit floats without a leading digit', function() {
				isNotValid(MiniPy.validate('.5'));
				isNotValid(MiniPy.validate('.420'));
			});

			it('should permit unsigned floats', function() {
				isValid('1.2');
				isValid('0.345494949');
			});

			it('should permit positively signed floats', function() {
				isValid('+2.3');
				isValid('+123.0');
			});

			it('should permit negatively signed floats', function() {
				isValid('-599384.0');
				isValid('-123.5');
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

	describe('Array', function() {
		describe('Initialization', function() {
			it('should create an empty array', function() {
				isValid('[]');
			});

			it('should create a simple array with literals with multiple types', function() {
				isValid('[ 1, 2, 3, 4 ]');
				isValid('[ "a", 2, "c" ]');
			});

			it('should allow arrays with hanging commas', function() {
				isValid('[ 1, 2, 3, 4, ]');
				isValid('[ , ]');
			});

			it('should create an array from variables', function() {
				isValid('a = True\nb = False\n[a, b, 234]');
			});

			it('should permit array literal assignment', function() {
				isValid('a = []');
				isValid('a = [,]');
				isValid('a = [1, 2, 3]');
			});
		});

		describe('Subscript notation', function () {
			it('should ', function (done) {
				
			});
		});
	});
});
