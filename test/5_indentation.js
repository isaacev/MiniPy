// [MiniPy] /test/5_indentation.js

var expect = require('chai').expect;
var MiniPy = require('../build/minipy');

describe('Indentation', function() {
	var isValid = function(script) {
		var validity = MiniPy.validate(script);
		expect(validity).to.be.true;
	};

	var isNotValid = function(script) {
		var validity = MiniPy.validate(script)
		expect(validity).to.be.an.instanceof(MiniPy.Error);
	};

	describe('Empty Lines', function() {
		// an "empty" line has only whitespace or comments and is semantically insignificant
		it('should ignore any empty lines between statements', function() {
			//|a = True
			//|\t\t\s\s
			//|b = False
			isValid('a = True\n\t\t   \nb = False');

			//|a = True
			//|\t\t\s\s\s
			//|
			//|\s\s\s\s
			//|b = False
			//|c = True
			isValid('a = True\n\t\t   \n\n    \nb = False\nc = True');
		});

		it('should allow empty lines at start of script', function() {
			//|
			//|
			//|
			//|a = True
			//|b = False
			isValid('\n\n\na = True\nb = False');

			//|
			//|___--->
			//|
			//|a = True
			//|b = False
			isValid('\n   \t\n\na = True\nb = False');
		});

		it('should allow empty lines at end of script', function() {
			//|a = True
			//|b = False
			//|
			//|
			//|
			isValid('a = True\nb = False\n\n\n');

			//|a = True
			//|b = False
			//|
			//|--->____--->
			isValid('a = True\nb = False\n\n\t    \t');
		});

		it('should allow lines with any indentation and comments', function() {
			//|a = True
			//|# a comment
			//|b = False
			isValid('a = True\n# a comment\nb = False');

			//|a = True
			//|---># a comment
			//|b = False
			isValid('a = True\n\t# a comment\nb = False');

			//|a = True
			//|__# a comment
			//|b = False
			isValid('a = True\n  # a comment\nb = False');

			//|a = True
			//|__# a comment
			//|
			//|b = False
			isValid('a = True\n  # a comment\n\nb = False');
		});
	});

	describe('Blocks', function () {
		it('should allow for one or more lines in a block', function () {
			//|if True:
			//|--->a = False
			isValid('if True:\n\ta = False');

			//|if True:
			//|--->a = 1
			//|--->b = 2
			//|--->c = 3
			isValid('if True:\n\ta = 1\n\tb = 2\n\tc = 3');
		});

		it('should handle statements after block dedent', function () {
			//|if True:
			//|--->a  = 1
			//|--->b = 2
			//|
			//|if False:
			//|--->c = 3
			//|--->d = 4
			isValid('if True:\n\ta = 1\n\tb = 2\n\nif False:\n\tc = 3\n\td = 4');
		});

		it('should ignore empty lines before statements', function () {
			//|
			//|___# comment
			//|if True:
			//|--->a = 1
			//|--->b = 2
			//|
			//|if False:
			//|--->c = 3
			//|--->d = 4
			isValid('\n   # comment\n\nif True:\n\ta = 1\n\tb = 2\n\nif False:\n\tc = 3\n\td = 4');
		});

		it('should ignore empty lines after statements', function () {
			//|if True:
			//|--->a = 1
			//|--->b = 2
			//|
			//|if False:
			//|--->c = 3
			//|--->d = 4
			//|
			//|
			//|___
			//|
			isValid('if True:\n\ta = 1\n\tb = 2\n\nif False:\n\tc = 3\n\td = 4\n\n\n   \n');
		});

		it('should close multiple blocks from a partial or fully dedented line', function () {
			//|if True:
			//|--->a = 1
			//|--->if True:
			//|--->--->b = 2
			//|print(a + b)
			isValid('if True:\n\ta = 1\n\tif True:\n\t\tb = 2\nprint(a + b)');

			//|if True:
			//|--->a = 1
			//|--->if True:
			//|--->--->b = 2
			//|--->print(a + b)
			isValid('if True:\n\ta = 1\n\tif True:\n\t\tb = 2\n\tprint(a + b)');

			//|if True:
			//|--->a = 1
			//|--->if True:
			//|--->--->b = 2
			//|
			isValid('if True:\n\ta = 1\n\tif True:\n\t\tb = 2\n');
		});

		it('should close multiple blocks from the end of the script', function () {
			//|if True:
			//|--->a = 1
			//|--->if True:
			//|--->--->b = 2
			isValid('if True:\n\ta = 1\n\tif True:\n\t\tb = 2');
		});

		it('should only allow blocks to be created after legal block statements', function () {
			//|if True:
			//|--->print(True)
			isValid('if True:\n\tprint(True)');

			//|a = True
			//|--->b = False
			//|--->c = False
			isNotValid('a = True\n\tb = False\n\tc = False')
		});
	});
});
