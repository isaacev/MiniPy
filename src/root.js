// [MiniPy] /src/root.js

(function(root) {
	var Scanner = require('./parser/scanner').Scanner;
	var Lexer = require('./parser/lexer').Lexer;
	var Parser = require('./parser/parser').Parser;
	var Interpreter = require('./runtime/interpreter').Interpreter;

	var defaultHooks = {
		print: function(arg) {
			console.log('PRINT: ' + arg);
		},
	};

	var defaultMaxLinesExecuted = 2000;

	function validate(code) {
		try {
			var s = new Scanner(code);
			var l = new Lexer(s);
			var p = new Parser(l);
			var a = p.parse();

			return true;
		} catch (err) {
			return err;
		}
	}

	function createInspector(code, opts) {
		opts = opts || {};

		var globals = opts.globals || {};
		var hooks = opts.hooks || defaultHooks;

		var s = new Scanner(code);
		var l = new Lexer(s);
		var p = new Parser(l);
		var a = p.parse();

		var i = new Interpreter(a, globals);
		i.load(hooks);

		return i;
	}

	function run(code, opts) {
		opts = opts || {};

		var maxLinesExecuted = opts.maxLinesExecuted || defaultMaxLinesExecuted;
		var linesExecuted = 0;

		var i = createInspector(code, opts);

		while (true) {
			var expression = i.next();

			linesExecuted += 1;

			if (expression === null) {
				if (opts.hook && opts.hook.exit && typeof opts.hook.exit === 'function') {
					opts.hook.exit.apply({}, []);
				}

				break;
			} else if (linesExecuted >= maxLinesExecuted) {
				var MiniPyError = require('./error/error');
				var ErrorType = require('./error/errorType');

				throw new MiniPyError(code, {
					type: ErrorType.EXECUTION_TIMEOUT,
					message: 'Program execution took too long, check for infinite loops',
				});
			}
		}
	}

	root({
		validate: validate,
		inspect: createInspector,
		run: run,

		Error: exports.MiniPyError,
	});
}(root));
