// [MiniPy] /test/6_operations.js

var expect = require('chai').expect;
var MiniPy = require('../build/' + require('../package.json').version);

describe('Statements', function() {
	function shouldPrint(script, expectations) {
		MiniPy.run(script, {
			globals: {
				print: function(value) {
					expect(value).to.equal(expectations.shift());
				},
			},
		});

		expect(expectations).to.have.length(0);
	}

	describe('If', function() {
		it('should run lone IF statement', function() {
			//|if True:
			//|--->print("if1")
			shouldPrint('if True:\n\tprint("if1")', ['if1']);

			//|if False:
			//|--->print("if1")
			shouldPrint('if False:\n\tprint("if1")', []);
		});

		it('should run lone IF statements in series', function() {
			//|if True:
			//|--->print("if1")
			//|
			//|if True:
			//|--->print("if2")
			shouldPrint('if True:\n\tprint("if1")\n\nif True:\n\tprint("if2")', ['if1', 'if2']);

			//|if True:
			//|--->print("if1")
			//|if True:
			//|--->print("if2")
			shouldPrint('if True:\n\tprint("if1")\nif True:\n\tprint("if2")', ['if1', 'if2']);
		});

		describe('Cascade', function() {
			it('should escape cascade on first match', function() {
				//|if True:
				//|--->print("if")
				//|else:
				//|--->print("else")
				shouldPrint('if True:\n\tprint("if")\nelse:\n\tprint("else")', ['if']);
			});

			it('should cascade until one condition passes', function() {
				//|if False:
				//|--->print("if")
				//|else:
				//|--->print("else")
				shouldPrint('if False:\n\tprint("if")\nelse:\n\tprint("else")', ['else']);

				//|if False:
				//|--->print("if")
				//|elif True:
				//|--->print("elif1")
				//|else:
				//|--->print("else")
				shouldPrint('if False:\n\tprint("if")\nelif True:\n\tprint("elif1")\nelse:\n\tprint("else")', ['elif1']);
			});

			it('should end cascade at else block (if it exists)', function() {
				//|if False:
				//|--->print("if")
				//|elif False:
				//|--->print("elif1")
				//|else:
				//|--->print("else")
				shouldPrint('if False:\n\tprint("if")\nelif False:\n\tprint("elif1")\nelse:\n\tprint("else")', ['else']);
			});
		});

		it('should execute nothing if no cases match', function() {
			//|if False:
			//|--->print("if")
			shouldPrint('if False:\n\tprint("if")', []);

			//|if False:
			//|--->print("if")
			//|elif False:
			//|--->print("elif1")
			//|elif False:
			//|--->print("elif2")
			shouldPrint('if False:\n\tprint("if")\nelif False:\n\tprint("elif1")\nelif False:\n\tprint("elif2")', []);
		});
	});

	describe('While', function () {
		it('should not execute if condition is immediately false', function () {
			//|while False:
			//|--->print("loop")
			shouldPrint('while False:\n\tprint("loop")', []);
		});

		it('should execute as long as condition is true', function () {
			//|i = 0
			//|while i < 5:
			//|--->print(i)
			//|print(i + 10)
			shouldPrint('i = 0\nwhile i < 5:\n\tprint(i)\n\ti = i + 1\nprint(i + 10)', [0, 1, 2, 3, 4, 15]);
		});
	});
});
