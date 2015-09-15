// [MiniPy] /src/minipy.js

var MiniPy = (function(main) {
	var ErrorType = {
		UNEXPECTED_EOF: 1,
		UNEXPECTED_TOKEN: 2,
		UNKNOWN_OPERATOR: 3,
		EXPECTED_NEWLINE: 4,
		EXPECTED_DIGIT: 5,
		UNTERMINATED_STRING: 6,
		UNEXPECTED_CHAR: 7,
		MALFORMED_NUMBER: 8,
		UNSUPPORTED_OPERATION: 9,
		TIMEOUT: 10,
	};

	var mods = {
		MiniPyError: MiniPyError || null,
		ErrorType: ErrorType,
		Scanner: Scanner || null,
		Lexer: Lexer || null,
		Parser: Parser || null,
		Interpreter: Interpreter || null,
	};

	var MiniPy = main(mods);

	if (typeof exports !== 'undefined' && typeof module !== 'undefined' && module.exports) {
		// environment is Node-like
		module.exports = MiniPy;
	}

	return MiniPy;
}(function(mods) {
	var defaultHooks = {
		print: function(arg) {
			console.log('PRINT: ' + arg);
		},
	};

	var defaultMaxLinesExecuted = 2000;

	function addNewline(code) {
		// TODO: this method should probably take a lexer
		// instead of a simple string so that any modifications
		// still retain original token line/column info
		return code + '\n';
	}

	function validate(code, opts) {
		code = addNewline(code);
		opts = opts || {};

		try {
			var scanner = new mods.Scanner(code);
			var lexer = new mods.Lexer(scanner);
			var parser = new mods.Parser(lexer);
			var ast = parser.parse();

			return true;
		} catch (err) {
			return err;
		}
	}

	function createInspector(code, opts) {
		code = addNewline(code);
		opts = opts || {};

		var scanner = new mods.Scanner(code);
		var lexer = new mods.Lexer(scanner);
		var parser = new mods.Parser(lexer);
		var ast = parser.parse();

		var globalVariables = opts.globals || {};
		var inspector = mods.Interpreter(ast, globalVariables);

		inspector.load(opts.hooks || defaultHooks);

		return inspector;
	}

	return {
		validate: validate,

		inspect: createInspector,

		run: function(code, opts) {
			code = addNewline(code);
			opts = opts || {};

			var inspector = createInspector(code, opts);
			var maxLinesExecuted = opts.maxLinesExecuted || defaultMaxLinesExecuted;
			var linesExecuted = 0;

			while (true) {
				var expression = inspector.next();
				linesExecuted++;

				if (expression === null) {
					break;
				} else if (linesExecuted >= maxLinesExecuted) {
					throw new mods.MiniPyError(code, {
						type: mods.ErrorType.TIMEOUT,
						message: 'Program execution timed out, check for infinite loops',
					});
				}
			}
		},

		debug: {
			getAST: function(code) {
				code = addNewline(code);

				var scanner = new mods.Scanner(code);
				var lexer = new mods.Lexer(scanner);
				var parser = new mods.Parser(lexer);
				var ast = parser.parse();

				return ast;
			},

			getScanner: function(code) {
				return new mods.Scanner(code);
			},

			getLexer: function(code) {
				var scanner = new mods.Scanner(code);
				return new mods.Lexer(scanner);
			},

			MiniPyError: mods.MiniPyError,
			ErrorType: mods.ErrorType,
		},
	};
}));
