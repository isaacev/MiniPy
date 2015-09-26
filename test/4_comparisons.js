// [MiniPy] /test/4_comparisons.js

var expect = require('chai').expect;
var MiniPy = require('../build/' + require('../package.json').version);

describe('Comparison', function() {
	function test(script) {
		MiniPy.run(script, {
			globals: {
				test: function(should, is) {
					expect(is.value).to.equal(should.value);
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

		describe('OR', function() {
			it('should return false only if both operand are false', function() {
				test('test(True,  True  or True)');
				test('test(True,  True  or False)');
				test('test(True,  False or True)');
				test('test(False, False or False)');
			});

			it('should be capable of being used in series', function() {
				test('test(True,  True  or True  or True)');
				test('test(True,  True  or True  or False)');
				test('test(True,  True  or False or False)');
				test('test(False, False or False or False)');
			});

			it('should not work on numbers', function() {
				expect(test.bind(test, 'test(True, 123 or 123)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,     0 or 0)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,  True or 1)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,    -1 or 1)')).to.throw(MiniPy.Error);
			});

			it('should not work on strings', function() {
				expect(test.bind(test, 'test(True,         "" or "")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, "True" or "True")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,   "True" or True)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True,   "abc" or "abc")')).to.throw(MiniPy.Error);
			});
		});
	});

	describe('Values', function() {
		describe('<', function() {
			it('should return true when left < right', function() {
				test('test(True, 10 < 100)');
				test('test(True, -100 < 10)');
			});

			it('should return false when left > right', function() {
				test('test(False, 100 < 10)');
				test('test(False, 10 < -100)');
			});

			it('should return false when left == right', function() {
				test('test(False, 100 < 100)');
				test('test(False, 0 < 0)');
			});

			it('should only accept numbers as operands', function () {
				expect(test.bind(test, 'test(True, "a" < "z")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, False < True)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, 100 < "a")')).to.throw(MiniPy.Error);
			});
		});

		describe('<=', function() {
			it('should return true when left < right', function() {
				test('test(True, 10 <= 100)');
				test('test(True, -100 <= 10)');
			});

			it('should return false when left > right', function() {
				test('test(False, 100 <= 10)');
				test('test(False, 10 <= -100)');
			});

			it('should return true when left == right', function() {
				test('test(True, 100 <= 100)');
				test('test(True, 0 <= 0)');
			});

			it('should only accept numbers as operands', function () {
				expect(test.bind(test, 'test(True, "a" <= "a")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, False <= True)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, 100 <= "a")')).to.throw(MiniPy.Error);
			});
		});

		describe('>', function() {
			it('should return true when left > right', function() {
				test('test(True, 100 > 10)');
				test('test(True, 10 > -100)');
			});

			it('should return false when left < right', function() {
				test('test(False, 10 > 100)');
				test('test(False, -100 > 10)');
			});

			it('should return false when left == right', function() {
				test('test(False, 100 > 100)');
				test('test(False, 0 > 0)');
			});

			it('should only accept numbers as operands', function () {
				expect(test.bind(test, 'test(True, "z" > "a")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, True > False)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, "a" > 100)')).to.throw(MiniPy.Error);
			});
		});


		describe('>=', function() {
			it('should return true when left > right', function() {
				test('test(True, 100 >= 10)');
				test('test(True, 10 >= -100)');
			});

			it('should return false when left < right', function() {
				test('test(False, 10 >= 100)');
				test('test(False, -100 >= 10)');
			});

			it('should return true when left == right', function() {
				test('test(True, 100 <= 100)');
				test('test(True, 0 <= 0)');
			});

			it('should only accept numbers as operands', function () {
				expect(test.bind(test, 'test(True, "a" >= "a")')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, True >= False)')).to.throw(MiniPy.Error);
				expect(test.bind(test, 'test(True, "a" >= 100)')).to.throw(MiniPy.Error);
			});
		});

		describe('==', function() {
			it('should return false when left > right', function() {
				test('test(False, 100 == 10)');
				test('test(False, 10 == -100)');
			});

			it('should return false when left < right', function() {
				test('test(False, 10 == 100)');
				test('test(False, -100 == 10)');
			});

			it('should return true when left == right', function() {
				test('test(True, -100 == -100)');
				test('test(True, 0 == 0)');
			});

			it('should accept booleans as operands', function () {
				test('test(True,  True == True)');
				test('test(False, True == False)');
				test('test(True,  False == False)');
			});

			it('should accept strings as operands', function () {
				test('test(True,  "a" == "a")');
				test('test(False, "a" == "z")');
				test('test(True,  "" == "")');
			});
		});

		describe('!=', function() {
			it('should return true when left > right', function() {
				test('test(True, 100 != 10)');
				test('test(True, 10 != -100)');
			});

			it('should return true when left < right', function() {
				test('test(True, 10 != 100)');
				test('test(True, -100 != 10)');
			});

			it('should return false when left == right', function() {
				test('test(False, -100 != -100)');
				test('test(False, 0 != 0)');
			});

			it('should accept booleans as operands', function () {
				test('test(False,  True != True)');
				test('test(True, True != False)');
				test('test(False,  False != False)');
			});

			it('should accept strings as operands', function () {
				test('test(False,  "a" != "a")');
				test('test(True, "a" != "z")');
				test('test(False,  "" != "")');
			});
		});
	});
});
