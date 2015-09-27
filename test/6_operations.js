// [MiniPy] /test/6_operations.js

var expect = require('chai').expect;
var MiniPy = require('../build/' + require('../package.json').version);

describe('Operations', function() {
	function test(script) {
		MiniPy.run(script, {
			globals: {
				test: function(should, is) {
					expect(is.value).to.deep.equal(should.value);
				}
			}
		});
	}

	describe('Numbers', function() {
		describe('+', function() {
			it('should add two integers', function() {
				test('test(904, 4 + 900)');
			});

			it('should add two floats', function() {
				test('test(4.2, 1.1 + 3.1)');

				// compute result at runtime to avoid errors arising from
				// mismatched levels of precision
				var result = 0.1 + 0.2;
				test('test(' + result + ', 0.1 + 0.2)');
			});

			it('should add many integers', function() {
				test('test(15, 1 + 2 + 3 + 4 + 5)');
			});

			it('should add many floats', function() {
				var result = 0.1 + 0.2 + 0.3 + 4.4;
				test('test(' + result + ', 0.1 + 0.2 + 0.3 + 4.4)');
			});
		});

		describe('-', function() {
			it('should subtract two integers', function() {
				test('test(2, 6 - 4)');
			});

			it('should subtract two floats', function() {
				var result = 5.5 - 5.1;
				test('test(' + result + ', 5.5 - 5.1)');
			});

			it('should subtract many integers', function() {
				test('test(0, 6 - 3 - 2 - 1)');
			});

			it('should subtract many floats', function() {
				var result = 5.5 - 0.5 - 0.2;
				test('test(' + result + ', 5.5 - 0.5 - 0.2)');
			});

			it('should negate an integer', function() {
				test('test(3, -5 + 8)');
			});

			it('should negate a float', function() {
				var result = 1.0;
				test('test(' + result + ', -3.2 + 4.2)');
			});
		});

		describe('*', function() {
			it('should multiply two integers', function() {
				var result = 23 * 42;
				test('test(' + result + ', 23 * 42)');
			});

			it('should multiply two floats', function() {
				var result = 0.3 * 42.9;
				test('test(' + result + ', 0.3 * 42.9)');
			});

			it('should multiply many integers', function() {
				var result = 1 * 5 * 2300;
				test('test(' + result + ', 1 * 5 * 2300)');
			});

			it('should multiply many floats', function() {
				var result = 0.5 * 0.2 * 0.9;
				test('test(' + result + ', 0.5 * 0.2 * 0.9)');
			});
		});

		describe('/', function() {
			it('should divide two integers', function() {
				var result = 4 / 5;
				test('test(' + result + ', 4 / 5)');
			});

			it('should divide two floats', function() {
				var result = 12.2 / 4.0;
				test('test(' + result + ', 12.2 / 4.0)');
			});

			it('should divide many integers', function() {
				var result = 64 / 8 / 2;
				test('test(' + result + ', 64 / 8 / 2)');
			});

			it('should divide many floats', function() {
				var result = 20.9 / 3.3 / 4.5;
				test('test(' + result + ', 20.9 / 3.3 / 4.5)');
			});

			it('should throw an error when dividing by 0', function() {
				expect(MiniPy.run.bind(MiniPy, '5 / 0')).to.throw(MiniPy.Error);
			});
		});

		describe('%', function() {
			it('should modulo two integers', function() {
				var result = 10 % 5;
				test('test(' + result + ', 10 % 5)');
			});

			it('should modulo two floats', function() {
				var result = 5.2 % 1.1;
				test('test(' + result + ', 5.2 % 1.1)');
			});

			it('should modulo many integers', function() {
				var result = 10 % 5 % 3;
				test('test(' + result + ', 10 % 5 % 3)');
			});

			it('should modulo many floats', function() {
				var result = 10.5 % 5.5 % 3.2;
				test('test(' + result + ', 10.5 % 5.5 % 3.2)');
			});

			it('should throw an error when using modulo by 0', function() {
				expect(MiniPy.run.bind(MiniPy, '5 / 0')).to.throw(MiniPy.Error);
			});

			it('should use mathematical modulo instead of JS modulo', function() {
				// JavaScript computes `-5 % 3` as `-2` instead of the mathematically
				// accurate result of `1`
				test('test(1, -5 % 3)');
			});
		});

		describe('**', function() {
			it('should exponentiate two integers', function() {
				var result = Math.pow(2, 2);
				test('test(' + result + ', 2 ** 2)');
			});

			it('should exponentiate two floats', function() {
				var result = Math.pow(4.0, 4.5);
				test('test(' + result + ', 4.0 ** 4.5)');
			});

			it('should exponentiate many integers', function() {
				var result = Math.pow(Math.pow(4, 3), 2);
				test('test(' + result + ', 4 ** 3 ** 2)');
			});

			it('should exponentiate many floats', function() {
				var result = Math.pow(Math.pow(4.0, 2.5), 3.0);
				test('test(' + result + ', 4.0 ** 2.5 ** 3.0)');
			});
		});
	});

	describe('Strings', function() {
		it('should concatenate two strings', function() {
			test('test("abcdef", "abc" + "def")');
		});

		it('should access string characters with subscript notation', function() {
			test('test("c", "abc"[2])');
		});

		it('should prevent modification with subscript notation', function() {
			expect(MiniPy.run.bind(MiniPy, 'a = "abc"\na[0] = "_"')).to.throw(MiniPy.Error);
		});
	});

	describe('Arrays', function() {
		it('should concatenate two arrays', function() {
			test('test(["a", "b", "c", "d"], ["a", "b"] + ["c", "d"])');
		});

		it('should access array element with subscript notation', function() {
			// positive indicies
			test('test("c", ["a", "b", "c", "d"][2])');

			// negative indices
			test('test("d", ["a", "b", "c", "d"][-1])');
			test('test("a", ["a", "b", "c", "d"][-4])');
		});

		it('should element modification with subscript notation', function() {
			test('a = ["a", "b"]\na[0] = "z"\ntest("z", a[0])');
		});
	});

	describe('Order of Operations', function() {
		it('should favor * over +', function() {
			test('test(22, 2 + 4 * 5)');
			test('test(30, (2 + 4) * 5)');
		});

		it('should favor / over -', function() {
			test('test(0, 5 - 20 / 4)');
			test('test(-3.75, (5 - 20) / 4)');
		});

		it('should execute + and - from left to right', function() {
			test('test(4, 5 + 6 - 8 + 1)');
		});

		it('should execute * and / from left to right', function() {
			test('test(20, 5 * 6 / 3 * 2)');
		});
	});
});
